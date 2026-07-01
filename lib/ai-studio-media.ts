import { rembgSourceUrl } from "@/lib/cloudinary-url";
import type { AiBackgroundResolved, AiResolvedProvider, StudioPipelineMode } from "@/lib/ai-engines";
import { isReplicateConfigured } from "@/lib/ai-engines";
import {
  geminiGenerateLuxuryBackground,
  geminiGenerateVideoFromImage,
  geminiRemoveBackground,
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
import { assertStudioQuota, trackAiUsage } from "@/lib/ai-usage";
import type { AiUsageMode } from "@/lib/ai-usage";

export type StudioVideoProvider = "kling" | "veo";

export async function studioRemoveBackground(
  imageUrl: string,
  engine: AiResolvedProvider,
  options: {
    mode?: StudioPipelineMode;
    projectId?: number;
    cached?: boolean;
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
    await assertStudioQuota("cutout");
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
    }
  }

  const optimizedUrl = rembgSourceUrl(imageUrl);
  const output = await runTrackedReplicate(
    MODELS.rembg,
    {
      image: optimizedUrl,
      preserve_alpha: true,
      preserve_partial_alpha: true,
    },
    {
      capability: "cutout",
      mode: usageMode,
      projectId: options.projectId,
    }
  );

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
      prompt: `Professional luxury jewelry photography background, empty scene, no jewelry, no people, no text: ${prompt}`,
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
    await assertStudioQuota("background");
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
    duration?: 5 | 10;
    mode?: "standard" | "pro";
    projectId?: number;
    studioMode?: StudioPipelineMode;
  },
  engine: AiResolvedProvider
): Promise<{ url: string; provider: StudioVideoProvider }> {
  const usageMode: AiUsageMode =
    options.studioMode === "marketing" ? "marketing" : "catalog";

  if (engine === "gemini") {
    await assertStudioQuota("video");
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
      const url = await uploadBufferToCloudinary(
        buffer,
        `studio-video-veo-${Date.now()}.mp4`,
        "video"
      );
      success = true;
      return { url, provider: "veo" };
    } catch (error) {
      if (!isReplicateConfigured()) {
        throw error;
      }
      console.warn("studio_video_veo_fallback_kling", error);
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
    }
  }

  const output = await runTrackedReplicate(
    MODELS.kling,
    {
      start_image: imageUrl,
      prompt: options.prompt,
      negative_prompt: options.negativePrompt,
      duration: options.duration ?? 5,
      mode: options.mode ?? "pro",
      generate_audio: false,
    },
    {
      capability: "video",
      mode: usageMode,
      projectId: options.projectId,
    }
  );

  return { url: extractUrl(output), provider: "kling" };
}
