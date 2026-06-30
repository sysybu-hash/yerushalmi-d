import type { StudioStylePresetId } from "@/lib/studio-presets";

export type GenerateImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
};

export type GenerateVideoOptions = {
  customPrompt?: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  mode?: "standard" | "pro";
  stylePreset?: StudioStylePresetId;
};
