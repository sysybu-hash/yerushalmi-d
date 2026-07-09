import type { AiEngineConfig } from "@/lib/ai-engines";
import { DEFAULT_AI_ENGINES, mergeAiEngineConfig } from "@/lib/ai-engines";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";
import type { StudioVideoMotionMode } from "@/lib/studio-types";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import { parseStudioVideoDuration } from "@/lib/studio-video-duration";
import type {
  StudioPipelineStepId,
  StudioStylePresetId,
  StudioWorkspaceUploadModeId,
} from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_VIDEO_ADJUSTMENTS,
  type AspectId,
  type ImageAdjustments,
  type MediaResourceType,
  type VideoAdjustments,
} from "@/lib/studio-transform";

export type StudioWorkflowStepNumber = 1 | 2 | 3 | 4;

export type StudioEditAsset = {
  url: string;
  /** כתובת ההעלאה המקורית — לשמירה בספריית התוכן */
  originalUrl: string;
  type: MediaResourceType;
  duration: number | null;
};

export type StudioEditSnapshot = {
  asset: StudioEditAsset | null;
  imageAdj: ImageAdjustments;
  videoAdj: VideoAdjustments;
  savedUrl: string | null;
  publishTarget: SettingKey;
  productTitle: string;
  productDescription: string;
  productPrice: string;
  productOriginalPrice: string;
  productType: "natural" | "lab";
  productCategory: string;
};

export const EMPTY_EDIT_SNAPSHOT: StudioEditSnapshot = {
  asset: null,
  imageAdj: DEFAULT_IMAGE_ADJUSTMENTS,
  videoAdj: DEFAULT_VIDEO_ADJUSTMENTS,
  savedUrl: null,
  publishTarget: "heroImage",
  productTitle: "",
  productDescription: "",
  productPrice: "",
  productOriginalPrice: "",
  productType: "natural",
  productCategory: "rings",
};

export type StudioClientState =
  | { status: "empty" }
  | { status: "uploaded"; source: string }
  | {
      status: "generating";
      source: string;
      kind: "image" | "video";
      step?: StudioPipelineStepId;
    }
  | {
      status: "cutout-preview";
      source: string;
      cutoutUrl: string;
      kind: "image";
    }
  | {
      status: "done";
      source: string;
      kind: "image" | "video";
      result: string;
      savedUrl?: string;
      videoProvider?: "kling" | "veo" | "preserve" | "svd";
    }
  | { status: "error"; source: string; message: string };

/** ניסיון שמור בגלריית העבודה — מאפשר חזרה והשוואה גם אחרי טעינה מחדש */
export type StudioSnapshotAttempt = {
  id: string;
  url: string;
  kind: "image" | "video";
  label: string;
  free: boolean;
  createdAt: number;
};

export type StudioProjectSnapshot = {
  version: 1;
  mode: "create" | "edit";
  workflowStep: StudioWorkflowStepNumber;
  state: StudioClientState;
  customPrompt: string;
  negativePrompt: string;
  stylePreset: StudioStylePresetId;
  videoPrompt: string;
  videoDuration: StudioVideoDurationSec;
  videoMode: "standard" | "pro";
  workspaceUploadMode: StudioWorkspaceUploadModeId;
  publishTarget: SettingKey;
  productTitle: string;
  productDescription: string;
  productPrice: string;
  productOriginalPrice: string;
  productType: "natural" | "lab";
  productCategory: string;
  aiEngines: AiEngineConfig;
  studioMode: "catalog" | "marketing";
  useAiBackground: boolean;
  highQualityBackground: boolean;
  cutoutUrl: string;
  edit: StudioEditSnapshot;
  /** גלריית ניסיונות (אופציונלי — נוסף ב-v2) */
  attempts?: StudioSnapshotAttempt[];
  /** סוג הקובץ שהועלה כמקור — תמונה או וידאו (נוסף ב-v2, נעדר בפרויקטים ישנים) */
  sourceKind?: "image" | "video";
  /** שדות v2 נוספים — שחזור מלא של UI */
  previewUrl?: string;
  previewPresetId?: StudioStylePresetId | null;
  videoMotion?: StudioVideoMotionMode;
  videoNativeAudio?: boolean;
  videoMultiShot?: MultiShotTemplateId;
  resultAspect?: AspectId;
  sourceAdj?: ImageAdjustments;
  videoAdj?: VideoAdjustments;
  /** URL המקורי שהועלה — לשחזור השוואת לפני/אחרי */
  sourceOriginalUrl?: string;
};

export function normalizeSnapshot(
  raw: StudioProjectSnapshot
): StudioProjectSnapshot {
  return {
    ...EMPTY_STUDIO_SNAPSHOT,
    ...raw,
    edit: {
      ...EMPTY_EDIT_SNAPSHOT,
      ...raw.edit,
      imageAdj: {
        ...DEFAULT_IMAGE_ADJUSTMENTS,
        ...raw.edit?.imageAdj,
      },
      videoAdj: {
        ...DEFAULT_VIDEO_ADJUSTMENTS,
        ...raw.edit?.videoAdj,
      },
      asset: raw.edit?.asset
        ? {
            ...raw.edit.asset,
            originalUrl:
              raw.edit.asset.originalUrl?.trim() || raw.edit.asset.url,
          }
        : null,
    },
    aiEngines: mergeAiEngineConfig(DEFAULT_AI_ENGINES, raw.aiEngines),
    studioMode: raw.studioMode === "marketing" ? "marketing" : "catalog",
    useAiBackground: Boolean(raw.useAiBackground),
    highQualityBackground: Boolean(raw.highQualityBackground),
    cutoutUrl: raw.cutoutUrl ?? "",
    videoDuration: parseStudioVideoDuration(raw.videoDuration),
    attempts: Array.isArray(raw.attempts) ? raw.attempts : [],
    sourceKind: raw.sourceKind === "video" ? "video" : "image",
    previewUrl: raw.previewUrl ?? "",
    previewPresetId: raw.previewPresetId ?? null,
    videoMotion: raw.videoMotion === "ai" ? "ai" : "preserve",
    videoNativeAudio: Boolean(raw.videoNativeAudio),
    videoMultiShot: raw.videoMultiShot ?? "none",
    resultAspect: raw.resultAspect ?? "original",
    sourceAdj: {
      ...DEFAULT_IMAGE_ADJUSTMENTS,
      ...raw.sourceAdj,
    },
    sourceOriginalUrl: raw.sourceOriginalUrl ?? "",
    videoAdj: {
      ...DEFAULT_VIDEO_ADJUSTMENTS,
      ...raw.videoAdj,
    },
  };
}

export const EMPTY_STUDIO_SNAPSHOT: StudioProjectSnapshot = {
  version: 1,
  mode: "create",
  workflowStep: 1,
  state: { status: "empty" },
  customPrompt: "",
  negativePrompt: "",
  stylePreset: "luxury-marble",
  videoPrompt: "",
  videoDuration: 5 as StudioVideoDurationSec,
  videoMode: "pro",
  workspaceUploadMode: "site-banner",
  publishTarget: "heroImage",
  productTitle: "",
  productDescription: "",
  productPrice: "",
  productOriginalPrice: "",
  productType: "natural",
  productCategory: "rings",
  aiEngines: DEFAULT_AI_ENGINES,
  studioMode: "catalog",
  useAiBackground: false,
  highQualityBackground: false,
  cutoutUrl: "",
  edit: EMPTY_EDIT_SNAPSHOT,
  sourceKind: "image",
};

export function snapshotThumbnailUrl(snapshot: StudioProjectSnapshot): string | null {
  const normalized = normalizeSnapshot(snapshot);

  if (normalized.mode === "edit") {
    return (
      normalized.edit.savedUrl ??
      normalized.edit.asset?.url ??
      null
    );
  }

  const { state } = normalized;
  if (state.status === "done") {
    return state.savedUrl ?? state.result ?? state.source;
  }
  if ("source" in state && state.source) {
    return state.source;
  }
  return null;
}

export function snapshotModeLabel(mode: "create" | "edit"): string {
  return mode === "edit" ? "עריכה" : "יצירה AI";
}

export function snapshotStatusLabel(
  status: "draft" | "in_progress" | "ready" | "published"
): string {
  switch (status) {
    case "draft":
      return "טיוטה";
    case "in_progress":
      return "בעבודה";
    case "ready":
      return "מוכן לפרסום";
    case "published":
      return "פורסם";
  }
}
