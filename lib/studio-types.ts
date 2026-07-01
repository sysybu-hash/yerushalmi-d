import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { AiEngineConfig, StudioPipelineMode } from "@/lib/ai-engines";

export type GenerateImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
  mode?: StudioPipelineMode;
  cutoutUrl?: string;
  useAiBackground?: boolean;
  highQualityBackground?: boolean;
  projectId?: number;
};

export type GenerateVideoOptions = {
  customPrompt?: string;
  negativePrompt?: string;
  duration?: 5 | 10;
  mode?: "standard" | "pro";
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
  studioMode?: StudioPipelineMode;
  compositeUrl?: string;
  skipImagePipeline?: boolean;
  projectId?: number;
};

export type StudioGenerateResult = {
  cutoutUrl: string;
  imageUrl: string;
  steps: Array<{ id: string; label: string }>;
  cachedCutout?: boolean;
};
