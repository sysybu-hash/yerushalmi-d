import { assertStudioEnv } from "@/lib/studio-env";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_PROMPT,
  JEWELRY_STRUCTURE_LOCK,
  STUDIO_CANVAS_SIZE,
  STUDIO_PRESET_LIGHTING_HINTS,
  STUDIO_VIDEO_PRESET_HINTS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
export { pipelineRemoveBackground } from "@/lib/studio-pipeline-remove-bg";
import { pipelineRemoveBackground } from "@/lib/studio-pipeline-remove-bg";
import {
  assertBackgroundEngineAvailable,
} from "@/lib/ai-engines";
import { getResolvedAiEngines, executeWithEngineFallback } from "@/lib/ai-engine-resolve";
import {
  studioGenerateBackground,
  studioGenerateVideo,
} from "@/lib/ai-studio-media";
import { translatePrompt } from "@/lib/ai-text";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import {
  setCachedComposite,
} from "@/lib/studio-cutout-cache";
import type {
  GenerateImageOptions,
  GenerateVideoOptions,
  StudioGenerateResult,
} from "@/lib/studio-types";

export type StudioImageOptions = GenerateImageOptions;

function assertCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש להעלות תמונת מקור דרך Cloudinary");
  }
}

function assertRemoteAssetUrl(url: string) {
  const allowed =
    url.startsWith("https://res.cloudinary.com/") ||
    url.startsWith("https://replicate.delivery/") ||
    /^https:\/\/[\w-]+\.replicate\.delivery\//.test(url);

  if (!allowed) {
    throw new Error("כתובת הנכס אינה תקינה");
  }
}

async function buildLightingHints(
  customPrompt?: string,
  stylePreset: StudioStylePresetId = "luxury-marble",
  textEngine: "replicate" | "gemini" = "replicate"
) {
  const presetHints = STUDIO_PRESET_LIGHTING_HINTS[stylePreset];
  const trimmed = customPrompt?.trim();
  if (!trimmed) return presetHints;
  try {
    const translated = await translatePrompt(trimmed, textEngine);
    return translated ? `${presetHints}, ${translated}` : presetHints;
  } catch {
    return presetHints;
  }
}

async function resolveBackgroundBuffer(
  preset: StudioStylePresetId,
  lightingHints: string,
  options: GenerateImageOptions
) {
  const studioMode = options.mode ?? "catalog";
  const useAiBackground = Boolean(options.useAiBackground);
  const engines = await getResolvedAiEngines(
    options.engines,
    studioMode,
    useAiBackground
  );

  if (engines.background === "procedural") {
    const { generatePresetBackground } = await import("@/lib/studio-backgrounds");
    return generatePresetBackground({
      preset,
      lightingHints,
      size: STUDIO_CANVAS_SIZE,
    });
  }

  assertBackgroundEngineAvailable(engines.background);

  try {
    return await studioGenerateBackground(
      {
        preset,
        lightingHints,
        size: STUDIO_CANVAS_SIZE,
        highQuality: options.highQualityBackground,
        projectId: options.projectId,
      },
      engines.background
    );
  } catch {
    const { generatePresetBackground } = await import("@/lib/studio-backgrounds");
    return generatePresetBackground({
      preset,
      lightingHints,
      size: STUDIO_CANVAS_SIZE,
    });
  }
}

export async function pipelineCompositeImage(
  cutoutUrl: string,
  options: StudioImageOptions = {}
) {
  assertStudioEnv();
  assertRemoteAssetUrl(cutoutUrl);

  const { compositeProductImage } = await import("@/lib/studio-composite");

  const preset = options.stylePreset ?? "luxury-marble";
  const studioMode = options.mode ?? "catalog";
  const engines = await getResolvedAiEngines(
    options.engines,
    studioMode,
    Boolean(options.useAiBackground)
  );
  const lightingHints = await buildLightingHints(
    options.customPrompt,
    preset,
    engines.text
  );
  const backgroundBuffer = await resolveBackgroundBuffer(
    preset,
    lightingHints,
    options
  );

  const buffer = await compositeProductImage(
    cutoutUrl,
    backgroundBuffer,
    STUDIO_CANVAS_SIZE,
    preset,
    { forVideo: options.forVideo }
  );
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-composite-${Date.now()}.jpg`,
    "image"
  );

  return { url };
}

export async function pipelineGenerateImage(
  sourceUrl: string,
  options: StudioImageOptions = {}
): Promise<StudioGenerateResult> {
  assertStudioEnv();
  assertCloudinaryUrl(sourceUrl);

  const studioMode = options.mode ?? "catalog";
  const steps: StudioGenerateResult["steps"] = [];

  steps.push({ id: "cutout", label: "מבודד את התכשיט המקורי" });
  const cutout = await pipelineRemoveBackground(sourceUrl, options.engines, {
    mode: studioMode,
    projectId: options.projectId,
    cutoutUrl: options.cutoutUrl,
  });

  steps.push({ id: "background", label: "בונה רקע יוקרתי" });
  steps.push({ id: "composite", label: "מרכיב — אותו תכשיט, רקע חדש" });

  const composite = await pipelineCompositeImage(cutout.url, options);
  setCachedComposite(sourceUrl, cutout.url, composite.url);

  return {
    cutoutUrl: cutout.url,
    imageUrl: composite.url,
    steps,
    cachedCutout: cutout.cached,
  };
}

export async function pipelineGenerateVideo(
  imageUrl: string,
  options: GenerateVideoOptions = {}
) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const studioMode = options.studioMode ?? "marketing";
  const engines = await getResolvedAiEngines(
    options.engines,
    studioMode,
    false
  );

  const motionMode = options.motionMode ?? "preserve";

  const englishCustom = options.customPrompt?.trim()
    ? await translatePrompt(options.customPrompt, engines.text)
    : "";

  const preset = options.stylePreset ?? "luxury-marble";
  const presetVideoHints = STUDIO_VIDEO_PRESET_HINTS[preset];

  const prompt = [
    JEWELRY_STRUCTURE_LOCK,
    DEFAULT_VIDEO_PROMPT,
    presetVideoHints,
    englishCustom,
  ]
    .filter(Boolean)
    .join(", ");

  return executeWithEngineFallback(
    "video",
    engines.preferences.video,
    (videoEngine) =>
      studioGenerateVideo(
        imageUrl,
        {
          prompt,
          negativePrompt:
            options.negativePrompt?.trim() || DEFAULT_VIDEO_NEGATIVE_PROMPT,
          duration: options.duration ?? 5,
          mode: options.mode ?? "pro",
          projectId: options.projectId,
          studioMode,
          motionMode,
          sourceVideoUrl: options.sourceVideoUrl,
          useSourceVideoMotion: options.useSourceVideoMotion,
        },
        videoEngine
      )
  );
}
