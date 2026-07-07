import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { AiEngineConfig, StudioPipelineMode } from "@/lib/ai-engines";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";

export type GenerateImageOptions = {
  customPrompt?: string;
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
  mode?: StudioPipelineMode;
  cutoutUrl?: string;
  useAiBackground?: boolean;
  highQualityBackground?: boolean;
  /** ללא צל/השתקפות — מונע מלבן טשטוש בווידאו AI */
  forVideo?: boolean;
  projectId?: number;
};

export type StudioVideoMotionMode = "preserve" | "ai";

export type GenerateVideoOptions = {
  customPrompt?: string;
  negativePrompt?: string;
  duration?: StudioVideoDurationSec;
  mode?: "standard" | "pro";
  stylePreset?: StudioStylePresetId;
  engines?: Partial<AiEngineConfig>;
  studioMode?: StudioPipelineMode;
  /** preserve = זום עדין מתמונה (מומלץ לתכשיטים), ai = Veo/Kling */
  motionMode?: StudioVideoMotionMode;
  /** וידאו מקורי — מיטוב תנועה מקורית (רק כש-useSourceVideoMotion) */
  sourceVideoUrl?: string;
  useSourceVideoMotion?: boolean;
  compositeUrl?: string;
  skipImagePipeline?: boolean;
  projectId?: number;
  /** אודיו נטיבי של Kling (סאונד שנוצר עם הווידאו) */
  generateAudio?: boolean;
  /** תבנית מולטי-שוט של Kling — עד 6 צילומים בקליפ */
  multiShotTemplate?: MultiShotTemplateId;
};

export type StudioGenerateResult = {
  cutoutUrl: string;
  imageUrl: string;
  steps: Array<{ id: string; label: string }>;
  cachedCutout?: boolean;
};
