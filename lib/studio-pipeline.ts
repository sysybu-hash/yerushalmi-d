import { assertStudioEnv } from "@/lib/studio-env";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_PROMPT,
  STUDIO_CANVAS_SIZE,
  STUDIO_PRESET_LIGHTING_HINTS,
  STUDIO_VIDEO_PRESET_HINTS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
export { pipelineRemoveBackground } from "@/lib/studio-pipeline-remove-bg";
import { assertEngineAvailable, resolveEngine } from "@/lib/ai-engines";
import { getResolvedAiEngines } from "@/lib/ai-engine-resolve";
import { translatePrompt } from "@/lib/ai-text";
import {
  extractUrl,
  MODELS,
  replicate,
  uploadBufferToCloudinary,
} from "@/lib/studio-replicate";
import type { GenerateVideoOptions } from "@/lib/studio-types";
import type { GenerateImageOptions } from "@/lib/studio-types";

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
  const translated = await translatePrompt(trimmed, textEngine);
  return translated ? `${presetHints}, ${translated}` : presetHints;
}

export async function pipelineCompositeImage(
  cutoutUrl: string,
  options: StudioImageOptions = {}
) {
  assertStudioEnv();
  assertRemoteAssetUrl(cutoutUrl);

  const [{ generatePresetBackground }, { compositeProductImage }] =
    await Promise.all([
      import("@/lib/studio-backgrounds"),
      import("@/lib/studio-composite"),
    ]);

  const preset = options.stylePreset ?? "luxury-marble";
  const engines = await getResolvedAiEngines(options.engines);
  const lightingHints = await buildLightingHints(
    options.customPrompt,
    preset,
    engines.text
  );
  const backgroundBuffer = await generatePresetBackground({
    preset,
    lightingHints,
    size: STUDIO_CANVAS_SIZE,
  });

  const buffer = await compositeProductImage(
    cutoutUrl,
    backgroundBuffer,
    STUDIO_CANVAS_SIZE
  );
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-composite-${Date.now()}.png`,
    "image"
  );

  return { url };
}

export async function pipelineGenerateVideo(
  imageUrl: string,
  options: GenerateVideoOptions = {}
) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const engines = await getResolvedAiEngines(options.engines);
  const videoEngine = resolveEngine("video", engines.preferences.video);
  assertEngineAvailable("video", videoEngine);

  const englishCustom = options.customPrompt?.trim()
    ? await translatePrompt(options.customPrompt, engines.text)
    : "";

  const preset = options.stylePreset ?? "luxury-marble";
  const presetVideoHints = STUDIO_VIDEO_PRESET_HINTS[preset];

  const prompt = [DEFAULT_VIDEO_PROMPT, presetVideoHints, englishCustom]
    .filter(Boolean)
    .join(", ");

  const output = await replicate.run(MODELS.kling, {
    input: {
      start_image: imageUrl,
      prompt,
      negative_prompt:
        options.negativePrompt?.trim() || DEFAULT_VIDEO_NEGATIVE_PROMPT,
      duration: options.duration ?? 5,
      mode: options.mode ?? "pro",
    },
  });

  return { url: extractUrl(output), provider: "kling" as const };
}
