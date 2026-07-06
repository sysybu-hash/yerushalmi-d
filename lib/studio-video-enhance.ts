import type { StudioStylePresetId } from "@/lib/studio-presets";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  JEWELRY_STRUCTURE_LOCK,
  STUDIO_STYLE_PRESETS,
} from "@/lib/studio-presets";
import {
  parseStudioVideoDuration,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import { assertEngineAvailable, isGeminiConfigured } from "@/lib/ai-engines";
import type { StudioPipelineMode } from "@/lib/ai-engines";
import { assertStudioQuota, trackAiUsage } from "@/lib/ai-usage";
import type { AiUsageMode } from "@/lib/ai-usage";
import { opaqueImageUrlForVideo, videoFrameJpgUrl } from "@/lib/cloudinary-url";
import { geminiGenerateVideoFromImage } from "@/lib/studio-gemini-media";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import { finalizeAiGeneratedVideo } from "@/lib/studio-video-audio";
import {
  buildTransformedUrl,
  type VideoAdjustments,
} from "@/lib/studio-transform";

export type VideoEnhancePreset = "stabilize" | "sharpen" | "color" | "catalog";
export type VideoEnhanceProvider = "cloudinary" | "gemini";

const PRESET_ADJUSTMENTS: Record<VideoEnhancePreset, Partial<VideoAdjustments>> =
  {
    stabilize: {
      autoEnhance: true,
      denoise: true,
      sharpen: false,
      contrast: 5,
    },
    sharpen: {
      autoEnhance: true,
      sharpen: true,
      contrast: 8,
      denoise: false,
    },
    color: {
      autoEnhance: true,
      autoColor: true,
      saturation: 5,
      contrast: 5,
    },
    catalog: {
      autoEnhance: true,
      autoColor: true,
      sharpen: true,
      contrast: 10,
      saturation: -5,
      aspect: "1:1",
    },
  };

const PRESET_VEO_PROMPT: Record<VideoEnhancePreset, string> = {
  catalog:
    "Luxury jewelry product video on opaque solid studio background, static camera, micro sparkle on existing facets only, professional catalog lighting",
  stabilize:
    "Stable jewelry product shot on opaque solid background, minimal movement, steady camera, soft studio light",
  sharpen:
    "Sharp macro jewelry detail on opaque solid background, crisp existing metal and stones, gentle shimmer, static composition",
  color:
    "Balanced natural colors on jewelry, opaque solid studio background, soft lighting, subtle reflections",
};

async function studioEnhanceVideoCloudinary(
  videoUrl: string,
  options: {
    preset: VideoEnhancePreset;
    mode?: StudioPipelineMode;
    projectId?: number;
  }
): Promise<{ url: string }> {
  const usageMode: AiUsageMode = options.mode ?? "catalog";
  const started = Date.now();
  let success = false;

  try {
    const patch = PRESET_ADJUSTMENTS[options.preset];
    const adjustments: VideoAdjustments = {
      aspect: patch.aspect ?? "original",
      mute: false,
      brightness: 0,
      saturation: patch.saturation ?? 0,
      contrast: patch.contrast ?? 0,
      trimStart: null,
      trimEnd: null,
      autoEnhance: patch.autoEnhance ?? true,
      autoColor: patch.autoColor ?? false,
      sharpen: patch.sharpen ?? false,
      denoise: false,
      audioStyle: "luxury",
      audioVolume: 32,
    };

    const transformed = buildTransformedUrl(videoUrl, "video", adjustments, {
      quality: "best",
    });
    const response = await fetch(transformed, {
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) {
      throw new Error("מיטוב הווידאו ב-Cloudinary נכשל");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const url = await uploadBufferToCloudinary(
      buffer,
      `studio-video-enhance-${Date.now()}.mp4`,
      "video"
    );
    success = true;
    return { url };
  } finally {
    await trackAiUsage({
      provider: "gemini",
      capability: "vision",
      modelId: "cloudinary-video-transform",
      mode: usageMode,
      success,
      durationMs: Date.now() - started,
      cached: true,
      projectId: options.projectId ?? null,
      metadata: { preset: options.preset, kind: "video-enhance-cloudinary" },
    });
  }
}

async function studioEnhanceVideoGemini(
  videoUrl: string,
  options: {
    preset: VideoEnhancePreset;
    mode?: StudioPipelineMode;
    projectId?: number;
    customPrompt?: string;
    duration?: StudioVideoDurationSec;
    stylePreset?: StudioStylePresetId;
  }
): Promise<{ url: string }> {
  if (!isGeminiConfigured()) {
    throw new Error(
      "מנוע Gemini לא מוגדר — הוסיפו GEMINI_API_KEY ב-Vercel או בחרו Cloudinary"
    );
  }
  assertEngineAvailable("vision", "gemini");
  await assertStudioQuota("cutout");
  const usageMode: AiUsageMode = options.mode ?? "catalog";
  const started = Date.now();
  let success = false;

  try {
    if (!videoUrl.includes("res.cloudinary.com")) {
      throw new Error("מיטוב Gemini דורש וידאו שהועלה ל-Cloudinary");
    }

    const frameUrl = videoFrameJpgUrl(videoUrl, 0);
    const veoInputUrl = opaqueImageUrlForVideo(frameUrl);

    const styleSuffix = options.stylePreset
      ? STUDIO_STYLE_PRESETS.find((p) => p.id === options.stylePreset)?.suffix
      : null;

    const veoPrompt = [
      JEWELRY_STRUCTURE_LOCK,
      PRESET_VEO_PROMPT[options.preset],
      styleSuffix ? `Scene style: ${styleSuffix}` : null,
      options.customPrompt?.trim(),
      "The entire frame must be fully opaque with a continuous solid background — no transparency, no alpha holes, no checkerboard.",
    ]
      .filter(Boolean)
      .join(" ");

    const videoBuffer = await geminiGenerateVideoFromImage({
      imageUrl: veoInputUrl,
      prompt: veoPrompt,
      negativePrompt: DEFAULT_VIDEO_NEGATIVE_PROMPT,
      duration: parseStudioVideoDuration(options.duration ?? 5),
      mode: "pro",
    });

    const uploaded = await uploadBufferToCloudinary(
      videoBuffer,
      `studio-video-gemini-${Date.now()}.mp4`,
      "video"
    );
    const url = await finalizeAiGeneratedVideo(uploaded, "studio-video-gemini");
    success = true;
    return { url };
  } finally {
    await trackAiUsage({
      provider: "gemini",
      capability: "vision",
      modelId: "gemini-video-enhance-veo",
      mode: usageMode,
      success,
      durationMs: Date.now() - started,
      projectId: options.projectId ?? null,
      metadata: { preset: options.preset, kind: "video-enhance-gemini" },
    });
  }
}

export async function studioEnhanceVideo(
  videoUrl: string,
  options: {
    preset: VideoEnhancePreset;
    provider?: VideoEnhanceProvider;
    mode?: StudioPipelineMode;
    projectId?: number;
    customPrompt?: string;
    duration?: StudioVideoDurationSec;
    stylePreset?: StudioStylePresetId;
  }
): Promise<{ url: string }> {
  const provider = options.provider ?? "cloudinary";

  if (provider === "gemini") {
    return studioEnhanceVideoGemini(videoUrl, options);
  }

  return studioEnhanceVideoCloudinary(videoUrl, options);
}
