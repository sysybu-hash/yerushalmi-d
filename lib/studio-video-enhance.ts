import type { StudioPipelineMode } from "@/lib/ai-engines";
import { assertStudioQuota, trackAiUsage } from "@/lib/ai-usage";
import type { AiUsageMode } from "@/lib/ai-usage";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import {
  buildTransformedUrl,
  type VideoAdjustments,
} from "@/lib/studio-transform";

export type VideoEnhancePreset = "stabilize" | "sharpen" | "color" | "catalog";

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

export async function studioEnhanceVideo(
  videoUrl: string,
  options: {
    preset: VideoEnhancePreset;
    mode?: StudioPipelineMode;
    projectId?: number;
  }
): Promise<{ url: string }> {
  await assertStudioQuota("video");
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
      denoise: patch.denoise ?? false,
      audioStyle: "original",
      audioVolume: 35,
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
      capability: "video",
      modelId: "cloudinary-video-enhance",
      mode: usageMode,
      success,
      durationMs: Date.now() - started,
      projectId: options.projectId ?? null,
      metadata: { preset: options.preset, kind: "video-enhance" },
    });
  }
}
