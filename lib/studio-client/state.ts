import type { AiEngineConfig } from "@/lib/ai-engines";
import { DEFAULT_AI_ENGINES } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import type { StudioVideoMotionMode } from "@/lib/studio-types";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_VIDEO_ADJUSTMENTS,
  type AspectId,
  type ImageAdjustments,
  type VideoAdjustments,
} from "@/lib/studio-transform";
import {
  EMPTY_STUDIO_SNAPSHOT,
  normalizeSnapshot,
  type StudioClientState,
  type StudioProjectSnapshot,
} from "@/lib/studio-project-snapshot";

/** שתי זרימות בלבד — קטלוג (חינם ברובו) ושיווק (וידאו/רקע AI בתשלום) */
export type StudioFlow = "catalog" | "marketing";

export type StageStatus = "idle" | "running" | "done" | "error";

/** פעולה שרצה כרגע — נעילה גלובלית: כל הכפתורים בתשלום מנוטרלים */
export type StudioBusyAction =
  | "upload"
  | "cutout"
  | "preview"
  | "image"
  | "video"
  | "enhance"
  | null;

export type StudioErrorInfo = {
  message: string;
  retryable: boolean;
  /** הפעולה שנכשלה — כפתור "נסה שוב" מפעיל אותה מחדש עם אותו מפתח */
  action: Exclude<StudioBusyAction, null>;
};

export type StudioSourceKind = "image" | "video";

/**
 * ניסיון בגלריה — כל תצוגה מקדימה ותוצאה נשמרות,
 * כך שאפשר לנווט אחורה ולהשוות בין עיצובים.
 */
export type StudioAttempt = {
  id: string;
  url: string;
  kind: StudioSourceKind;
  /** תיאור קצר: שם הסגנון / המנוע / "מקור ערוך" */
  label: string;
  free: boolean;
  createdAt: number;
};

export type StudioV2State = {
  flow: StudioFlow;
  /** צילום הגלם שהועלה */
  source: {
    url: string | null;
    kind: StudioSourceKind;
    duration: number | null;
  };
  /** תכשיט מבודד (הסרת רקע) */
  cutout: { url: string | null; status: StageStatus; cached: boolean };
  /**
   * תצוגה מקדימה חינמית — קומפוזיט פרוצדורלי (קטלוג)
   * או zoompan (שיווק). נוצרת לפני כל צעד בתשלום.
   */
  preview: {
    url: string | null;
    kind: StudioSourceKind;
    status: StageStatus;
    presetId: StudioStylePresetId | null;
  };
  /** תוצאה סופית (יכולה להיות בתשלום) */
  result: {
    url: string | null;
    kind: StudioSourceKind | null;
    status: StageStatus;
    provider: string | null;
  };
  stylePreset: StudioStylePresetId;
  customPrompt: string;
  videoPrompt: string;
  videoDuration: StudioVideoDurationSec;
  videoMotion: StudioVideoMotionMode;
  /** אודיו נטיבי של Kling */
  videoNativeAudio: boolean;
  /** תבנית מולטי-שוט של Kling */
  videoMultiShot: MultiShotTemplateId;
  useAiBackground: boolean;
  highQualityBackground: boolean;
  aiEngines: AiEngineConfig;
  advancedOpen: boolean;
  productTitle: string;
  productPrice: string;
  /** גלריית כל הניסיונות — ניווט והשוואה בין עיצובים */
  attempts: StudioAttempt[];
  /** הניסיון שמוצג בקנבס (null = האחרון/הזרימה הרגילה) */
  selectedAttemptId: string | null;
  /** עריכת צילום המקור (חינם — Cloudinary) */
  sourceAdj: ImageAdjustments;
  /** יחס גובה-רוחב לתוצאה (פוסט/סטורי/רוחב) */
  resultAspect: AspectId;
  /** התאמות ואודיו לתוצאת/מקור וידאו (חינם — Cloudinary) */
  videoAdj: VideoAdjustments;
  usage: {
    imagesToday: number;
    imageLimit: number;
    videosToday: number;
    videoLimit: number;
    costTodayUsd: number;
  } | null;
  error: StudioErrorInfo | null;
  busyAction: StudioBusyAction;
  toast: string | null;
};

export const INITIAL_STUDIO_STATE: StudioV2State = {
  flow: "catalog",
  source: { url: null, kind: "image", duration: null },
  cutout: { url: null, status: "idle", cached: false },
  preview: { url: null, kind: "image", status: "idle", presetId: null },
  result: { url: null, kind: null, status: "idle", provider: null },
  stylePreset: "luxury-marble",
  customPrompt: "",
  videoPrompt: "",
  videoDuration: 5 as StudioVideoDurationSec,
  videoMotion: "preserve",
  videoNativeAudio: false,
  videoMultiShot: "none",
  useAiBackground: false,
  highQualityBackground: false,
  aiEngines: DEFAULT_AI_ENGINES,
  advancedOpen: false,
  productTitle: "",
  productPrice: "",
  attempts: [],
  selectedAttemptId: null,
  sourceAdj: { ...DEFAULT_IMAGE_ADJUSTMENTS, autoEnhance: false, autoColor: false, sharpen: false, contrast: 0, upscale: false },
  resultAspect: "original",
  videoAdj: DEFAULT_VIDEO_ADJUSTMENTS,
  usage: null,
  error: null,
  busyAction: null,
  toast: null,
};

/** גזירת StudioClientState הישן — תאימות עם snapshot של פרויקטים קיימים */
function toClientState(state: StudioV2State): StudioClientState {
  const source = state.source.url;
  if (!source) return { status: "empty" };
  if (state.busyAction === "image" || state.busyAction === "video") {
    return {
      status: "generating",
      source,
      kind: state.busyAction === "video" ? "video" : "image",
    };
  }
  if (state.result.url && state.result.kind) {
    return {
      status: "done",
      source,
      kind: state.result.kind,
      result: state.result.url,
      videoProvider:
        state.result.kind === "video"
          ? (state.result.provider as "kling" | "veo" | "preserve" | undefined)
          : undefined,
    };
  }
  if (state.cutout.url) {
    return {
      status: "cutout-preview",
      source,
      cutoutUrl: state.cutout.url,
      kind: "image",
    };
  }
  return { status: "uploaded", source };
}

/** המרה ל-snapshot של פרויקט — שימוש חוזר בטבלת studio_projects הקיימת */
export function stateToSnapshot(state: StudioV2State): StudioProjectSnapshot {
  return normalizeSnapshot({
    ...EMPTY_STUDIO_SNAPSHOT,
    mode: "create",
    workflowStep: state.result.url ? 4 : state.source.url ? 3 : 1,
    state: toClientState(state),
    customPrompt: state.customPrompt,
    stylePreset: state.stylePreset,
    videoPrompt: state.videoPrompt,
    videoDuration: state.videoDuration,
    productTitle: state.productTitle,
    productPrice: state.productPrice,
    aiEngines: state.aiEngines,
    studioMode: state.flow,
    useAiBackground: state.useAiBackground,
    highQualityBackground: state.highQualityBackground,
    cutoutUrl: state.cutout.url ?? "",
    attempts: state.attempts,
    sourceKind: state.source.kind,
  });
}

/** שחזור state מ-snapshot שמור (פתיחת עבודה מתיק העבודות) */
export function snapshotToState(raw: StudioProjectSnapshot): StudioV2State {
  const snapshot = normalizeSnapshot(raw);
  const clientState = snapshot.state;

  const sourceUrl =
    "source" in clientState && clientState.source ? clientState.source : null;
  const resultUrl =
    clientState.status === "done" ? clientState.result : null;
  const resultKind = clientState.status === "done" ? clientState.kind : null;

  return {
    ...INITIAL_STUDIO_STATE,
    flow: snapshot.studioMode,
    source: {
      url: sourceUrl,
      kind: snapshot.sourceKind ?? "image",
      duration: null,
    },
    cutout: {
      url: snapshot.cutoutUrl || null,
      status: snapshot.cutoutUrl ? "done" : "idle",
      cached: Boolean(snapshot.cutoutUrl),
    },
    result: {
      url: resultUrl,
      kind: resultKind,
      status: resultUrl ? "done" : "idle",
      provider:
        clientState.status === "done"
          ? (clientState.videoProvider ?? null)
          : null,
    },
    stylePreset: snapshot.stylePreset,
    customPrompt: snapshot.customPrompt,
    videoPrompt: snapshot.videoPrompt,
    videoDuration: snapshot.videoDuration,
    useAiBackground: snapshot.useAiBackground,
    highQualityBackground: snapshot.highQualityBackground,
    aiEngines: snapshot.aiEngines,
    productTitle: snapshot.productTitle,
    productPrice: snapshot.productPrice,
    attempts: snapshot.attempts ?? [],
  };
}
