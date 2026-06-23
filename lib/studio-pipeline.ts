import { rembgSourceUrl } from "@/lib/cloudinary-url";
import { generatePresetBackground } from "@/lib/studio-backgrounds";
import { compositeProductImage } from "@/lib/studio-composite";
import { assertStudioEnv } from "@/lib/studio-env";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_PROMPT,
  STUDIO_CANVAS_SIZE,
  STUDIO_PRESET_LIGHTING_HINTS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
import {
  extractUrl,
  MODELS,
  replicate,
  translateToEnglish,
  uploadBufferToCloudinary,
} from "@/lib/studio-replicate";
import type { GenerateVideoOptions } from "@/lib/studio-types";

export type StudioImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
};

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
  stylePreset: StudioStylePresetId = "luxury-marble"
) {
  const presetHints = STUDIO_PRESET_LIGHTING_HINTS[stylePreset];
  const trimmed = customPrompt?.trim();
  if (!trimmed) return presetHints;
  const translated = await translateToEnglish(trimmed);
  return translated ? `${presetHints}, ${translated}` : presetHints;
}

export async function pipelineRemoveBackground(imageUrl: string) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const optimizedUrl = rembgSourceUrl(imageUrl);
  const output = await replicate.run(MODELS.rembg, {
    input: { image: optimizedUrl },
  });

  return { url: extractUrl(output) };
}

export async function pipelineCompositeImage(
  cutoutUrl: string,
  options: StudioImageOptions = {}
) {
  assertStudioEnv();
  assertRemoteAssetUrl(cutoutUrl);

  const preset = options.stylePreset ?? "luxury-marble";
  const lightingHints = await buildLightingHints(options.customPrompt, preset);
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

  const englishCustom = options.customPrompt?.trim()
    ? await translateToEnglish(options.customPrompt)
    : "";

  const prompt = englishCustom
    ? `${DEFAULT_VIDEO_PROMPT}, ${englishCustom}`
    : DEFAULT_VIDEO_PROMPT;

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
