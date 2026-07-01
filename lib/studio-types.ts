import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { AiEngineConfig } from "@/lib/ai-engines";

export type GenerateImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
};

export type GenerateVideoOptions = {
  customPrompt?: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  mode?: "standard" | "pro";
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
};
