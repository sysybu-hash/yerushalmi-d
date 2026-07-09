import { rembgSourceUrl } from "@/lib/cloudinary-url";
import type { AiBackgroundResolved, AiResolvedProvider, StudioPipelineMode } from "@/lib/ai-engines";
import {
  geminiEnhanceSourceImage,
  geminiGenerateLuxuryBackground,
  geminiGenerateVideoFromImage,
  geminiRemoveBackground,
  type SourceEnhancePreset,
} from "@/lib/studio-gemini-media";
import { STUDIO_PRESET_LIGHTING_HINTS, type StudioStylePresetId } from "@/lib/studio-presets";
import {
  BACKGROUND_NEGATIVE,
  extractUrl,
  MODELS,
  runTrackedReplicate,
  uploadBufferToCloudinary,
} from "@/lib/studio-replicate";
import { fetchImageDataUri } from "@/lib/vision-image";
import { normalizeJewelryCutout } from "@/lib/studio-composite";
import {
  mapDurationForKling,
  parseStudioVideoDuration,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import { generatePreservedMotionVideo, generateProfessionalSourceVideo } from "@/lib/studio-motion-video";
import { isCloudinaryVideoUrl } from "@/lib/cloudinary-url";
import { buildKlingMultiPrompt, type MultiShotTemplateId } from "@/lib/studio-multishot";
import { JEWELRY_STRUCTURE_LOCK } from "@/lib/studio-presets";
import type { StudioVideoMotionMode } from "@/lib/studio-types";
import { reserveStudioQuota, trackAiUsage } from "@/lib/ai-usage";
import type { AiUsageMode } from "@/lib/ai-usage";

export type StudioVideoProvider = "kling" | "veo" | "preserve";

export async function studioRemoveBackground(
  imageUrl: string,
  engine: AiResolvedProvider,
  options: {
    mode?: StudioPipelineMode;
    projectId?: number;
    cached?: boolean;
    /** דילוג על הניסיון הפרוצדורלי — ישר ל-AI (בידוד מחדש מאולץ) */
    skipProcedural?: boolean;
  } = {}
): Promise<{ url: string }> {
  const usageMode: AiUsageMode = options.mode ?? "catalog";

  if (options.cached) {
    await trackAiUsage({
      provider: engine === "gemini" ? "gemini" : "replicate",
      capability: "cutout",
      modelId: engine === "gemini" ? "gemini-3.1-flash-image" : MODELS.rembg,
      mode: usageMode,
      success: true,
      cached: true,
      projectId: options.projectId ?? null,
    });
    return { url: imageUrl };
  }

  if (engine === "gemini") {
    const quota = await reserveStudioQuota("cutout");
    const started = Date.now();
    let success = false;
    try {
      const dataUri = await fetchImageDataUri(rembgSourceUrl(imageUrl));
      const rawBuffer = await geminiRemoveBackground(dataUri);
      const buffer = await normalizeJewelryCutout(rawBuffer);
      const url = await uploadBufferToCloudinary(
        buffer,
        `studio-cutout-gemini-${Date.now()}.png`,
        "image"
      );
      success = true;
      return { url };
    } finally {
      await trackAiUsage({
        provider: "gemini",
        capability: "cutout",
        modelId: "gemini-3.1-flash-image",
        mode: usageMode,
        success,
        durationMs: Date.now() - started,
        projectId: options.projectId ?? null,
      });
      await quota.release();
    }
  }

  const optimizedUrl = rembgSourceUrl(imageUrl);
  let output: unknown;
  try {
    output = await runTrackedReplicate(
      MODELS.rembg,
      {
        image: optimizedUrl,
        preserve_alpha: true,
        preserve_partial_alpha: false,
      },
      {
        capability: "cutout",
        mode: usageMode,
        projectId: options.projectId,
      }
    );
  } catch (error) {
    console.error("studio_cutout_replicate_failed", error);
    throw new Error(
      "בידוד ה-AI נכשל — ייתכן שחשבון ה-Replicate חסר קרדיט. טענו קרדיט ב-replicate.com/account/billing ונסו שוב."
    );
  }

  const remoteUrl = extractUrl(output);
  const cutoutResponse = await fetch(remoteUrl, {
    signal: AbortSignal.timeout(60_000),
  });
  if (!cutoutResponse.ok) {
    throw new Error("לא ניתן להוריד את תוצאת ה-cutout מ-Replicate");
  }

  const buffer = await normalizeJewelryCutout(
    Buffer.from(await cutoutResponse.arrayBuffer())
  );
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-cutout-bria-${Date.now()}.png`,
    "image"
  );

  return { url };
}

function buildBackgroundPrompt(
  preset: StudioStylePresetId,
  lightingHints: string
): string {
  const presetHints = STUDIO_PRESET_LIGHTING_HINTS[preset];
  return [presetHints, lightingHints].filter(Boolean).join(", ");
}

async function fetchReplicateImageBuffer(output: unknown): Promise<Buffer> {
  const imageUrl = extractUrl(output);
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error("לא ניתן להוריד את הרקע שנוצר ב-Replicate");
  }
  return Buffer.from(await response.arrayBuffer());
}

async function generateFluxBackground(prompt: string): Promise<Buffer> {
  const output = await runTrackedReplicate(
    MODELS.fluxSchnell,
    {
      // Flux Schnell has no negative_prompt field — the same exclusions
      // enforced via BACKGROUND_NEGATIVE for SDXL are folded into the text here.
      prompt: `Professional luxury jewelry photography background, empty scene, no jewelry, no ring, no necklace, no bracelet, no earrings, no diamond, no product, no hands, no people, no text, no watermark, no logo: ${prompt}`,
      aspect_ratio: "1:1",
      output_format: "png",
      num_outputs: 1,
    },
    { capability: "background", mode: "marketing" }
  );
  return fetchReplicateImageBuffer(output);
}

export async function generateSdxlBackground(prompt: string): Promise<Buffer> {
  const output = await runTrackedReplicate(
    MODELS.sdxl,
    {
      prompt: `Professional luxury jewelry photography background, empty scene, no jewelry, no people, no text: ${prompt}`,
      negative_prompt: BACKGROUND_NEGATIVE,
      width: 1024,
      height: 1024,
      num_outputs: 1,
    },
    { capability: "background", mode: "marketing" }
  );
  return fetchReplicateImageBuffer(output);
}

export async function studioGenerateBackground(
  options: {
    preset: StudioStylePresetId;
    lightingHints: string;
    size: number;
    highQuality?: boolean;
    projectId?: number;
  },
  engine: AiBackgroundResolved
): Promise<Buffer> {
  const prompt = buildBackgroundPrompt(options.preset, options.lightingHints);

  if (engine === "gemini") {
    const quota = await reserveStudioQuota("background");
    const started = Date.now();
    let success = false;
    try {
      const buffer = await geminiGenerateLuxuryBackground(prompt);
      success = true;
      return buffer;
    } finally {
      await trackAiUsage({
        provider: "gemini",
        capability: "background",
        modelId: "gemini-3.1-flash-image",
        mode: "marketing",
        success,
        durationMs: Date.now() - started,
        projectId: options.projectId ?? null,
      });
      await quota.release();
    }
  }

  if (engine === "replicate") {
    if (options.highQuality) {
      return generateSdxlBackground(prompt);
    }
    return generateFluxBackground(prompt);
  }

  throw new Error("רקע פרוצדורלי — אין קריאת AI");
}

export async function studioGenerateVideo(
  imageUrl: string,
  options: {
    prompt: string;
    negativePrompt?: string;
    duration?: StudioVideoDurationSec;
    mode?: "standard" | "pro";
    projectId?: number;
    studioMode?: StudioPipelineMode;
    motionMode?: StudioVideoMotionMode;
    sourceVideoUrl?: string;
    useSourceVideoMotion?: boolean;
    generateAudio?: boolean;
    multiShotTemplate?: MultiShotTemplateId;
  },
  engine: AiResolvedProvider
): Promise<{ url: string; provider: StudioVideoProvider }> {
  const motionMode = options.motionMode ?? "preserve";

  if (
    motionMode === "preserve" &&
    options.useSourceVideoMotion &&
    options.sourceVideoUrl &&
    isCloudinaryVideoUrl(options.sourceVideoUrl)
  ) {
    const { url } = await generateProfessionalSourceVideo(
      options.sourceVideoUrl,
      options.duration ?? 10
    );
    return { url, provider: "preserve" };
  }

  if (motionMode === "preserve") {
    const { url } = await generatePreservedMotionVideo(
      imageUrl,
      options.duration ?? 5
    );
    return { url, provider: "preserve" };
  }

  const usageMode: AiUsageMode =
    options.studioMode === "marketing" ? "marketing" : "catalog";

  if (engine === "gemini") {
    const quota = await reserveStudioQuota("video");
    const started = Date.now();
    let success = false;
    try {
      const buffer = await geminiGenerateVideoFromImage({
        imageUrl,
        prompt: options.prompt,
        negativePrompt: options.negativePrompt,
        duration: options.duration,
        mode: options.mode,
      });
      const uploaded = await uploadBufferToCloudinary(
        buffer,
        `studio-video-veo-${Date.now()}.mp4`,
        "video"
      );
      success = true;
      return { url: uploaded, provider: "veo" };
    } finally {
      await trackAiUsage({
        provider: "gemini",
        capability: "video",
        modelId: "veo-3.1-fast-generate-preview",
        mode: usageMode,
        success,
        durationMs: Date.now() - started,
        projectId: options.projectId ?? null,
      });
      await quota.release();
    }
  }

  const replicateDuration = mapDurationForKling(
    parseStudioVideoDuration(options.duration ?? 5)
  );

  const multiPrompt = buildKlingMultiPrompt(
    options.multiShotTemplate ?? "none",
    replicateDuration,
    JEWELRY_STRUCTURE_LOCK
  );

  const output = await runTrackedReplicate(
    MODELS.kling,
    {
      start_image: imageUrl,
      prompt: options.prompt,
      negative_prompt: options.negativePrompt,
      duration: replicateDuration,
      mode: options.mode ?? "pro",
      generate_audio: Boolean(options.generateAudio),
      ...(multiPrompt ? { multi_prompt: multiPrompt } : {}),
    },
    {
      capability: "video",
      mode: usageMode,
      projectId: options.projectId,
      metadata: multiPrompt
        ? { multiShot: options.multiShotTemplate }
        : undefined,
    }
  );

  const rawUrl = extractUrl(output);
  return { url: rawUrl.includes("res.cloudinary.com") ? rawUrl : await ensureCloudinaryKlingUrl(rawUrl), provider: "kling" };
}

async function ensureCloudinaryKlingUrl(remoteUrl: string): Promise<string> {
  const response = await fetch(remoteUrl, { signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error("הורדת הווידאו מ-Kling נכשלה");
  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadBufferToCloudinary(
    buffer,
    `studio-video-kling-${Date.now()}.mp4`,
    "video"
  );
}

export async function studioEnhanceSource(
  imageUrl: string,
  options: {
    preset: SourceEnhancePreset;
    customPrompt?: string;
    mode?: StudioPipelineMode;
    projectId?: number;
  }
): Promise<{ url: string }> {
  const quota = await reserveStudioQuota("cutout");
  const usageMode: AiUsageMode = options.mode ?? "catalog";
  const started = Date.now();
  let success = false;

  try {
    const dataUri = await fetchImageDataUri(rembgSourceUrl(imageUrl));
    const buffer = await geminiEnhanceSourceImage(dataUri, {
      preset: options.preset,
      customPrompt: options.customPrompt,
    });
    const url = await uploadBufferToCloudinary(
      buffer,
      `studio-source-enhance-${Date.now()}.png`,
      "image"
    );
    success = true;
    return { url };
  } finally {
    await trackAiUsage({
      provider: "gemini",
      capability: "vision",
      modelId: "gemini-3.1-flash-image",
      mode: usageMode,
      success,
      durationMs: Date.now() - started,
      projectId: options.projectId ?? null,
      metadata: { preset: options.preset },
    });
    await quota.release();
  }
}
