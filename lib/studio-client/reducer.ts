import type { AiEngineConfig } from "@/lib/ai-engines";
import {
  isAiBackgroundProvider,
  syncEnginesForUseAiBackground,
} from "@/lib/studio-engine-ui";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import type { StudioVideoMotionMode } from "@/lib/studio-types";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";
import type {
  AspectId,
  ImageAdjustments,
  VideoAdjustments,
} from "@/lib/studio-transform";
import {
  INITIAL_STUDIO_STATE,
  type StudioAttempt,
  type StudioBusyAction,
  type StudioErrorInfo,
  type StudioFlow,
  type StudioSourceKind,
  type StudioV2State,
} from "./state";

/** מוסיף ניסיון לגלריה — בלי כפילויות לפי URL, החדש ראשון */
function appendAttempt(
  attempts: StudioAttempt[],
  attempt: Omit<StudioAttempt, "id" | "createdAt">
): StudioAttempt[] {
  if (attempts.some((a) => a.url === attempt.url)) return attempts;
  return [
    {
      ...attempt,
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    },
    ...attempts,
  ].slice(0, 40);
}

export type StudioAction =
  | { type: "RESET" }
  | { type: "RESTORE"; state: StudioV2State }
  | { type: "SET_FLOW"; flow: StudioFlow }
  | {
      type: "SOURCE_UPLOADED";
      url: string;
      kind: StudioSourceKind;
      duration?: number | null;
      /** שומר את המקור הראשון לשוואת לפני/אחרי */
      keepOriginal?: boolean;
    }
  | { type: "SET_PRESET"; presetId: StudioStylePresetId }
  | { type: "SET_CUSTOM_PROMPT"; value: string }
  | { type: "SET_VIDEO_PROMPT"; value: string }
  | { type: "SET_VIDEO_DURATION"; value: StudioVideoDurationSec }
  | { type: "SET_VIDEO_MOTION"; value: StudioVideoMotionMode }
  | { type: "SET_VIDEO_NATIVE_AUDIO"; value: boolean }
  | { type: "SET_VIDEO_MULTISHOT"; value: MultiShotTemplateId }
  | { type: "SET_USE_AI_BACKGROUND"; value: boolean }
  | { type: "SET_HIGH_QUALITY_BACKGROUND"; value: boolean }
  | { type: "SET_ENGINES"; engines: AiEngineConfig }
  | { type: "SET_PRODUCT_TITLE"; value: string }
  | { type: "SET_PRODUCT_PRICE"; value: string }
  | { type: "ACTION_STARTED"; action: Exclude<StudioBusyAction, null> }
  | { type: "CUTOUT_DONE"; url: string; cached: boolean }
  | {
      type: "PREVIEW_DONE";
      url: string;
      kind: StudioSourceKind;
      label?: string;
      free?: boolean;
    }
  | {
      type: "PREVIEW_AND_RESULT_DONE";
      url: string;
      kind: StudioSourceKind;
      provider?: string | null;
      label?: string;
      free?: boolean;
    }
  | {
      type: "RESULT_DONE";
      url: string;
      kind: StudioSourceKind;
      provider?: string | null;
      label?: string;
      free?: boolean;
    }
  | {
      type: "ATTEMPT_ADDED";
      url: string;
      kind: StudioSourceKind;
      label: string;
      free: boolean;
    }
  | { type: "SELECT_ATTEMPT"; id: string | null }
  | { type: "DELETE_ATTEMPT"; id: string }
  | { type: "USE_ATTEMPT_AS_RESULT"; id: string }
  | { type: "SET_RESULT_ASPECT"; value: AspectId }
  | { type: "SET_SOURCE_ADJ"; value: ImageAdjustments }
  | { type: "SET_VIDEO_ADJ"; value: VideoAdjustments }
  | { type: "CONTINUE_FROM_RESULT" }
  | { type: "USE_SOURCE_DIRECTLY" }
  | { type: "ACTION_FAILED"; error: StudioErrorInfo }
  | { type: "CLEAR_ERROR" }
  | { type: "USAGE_LOADED"; usage: NonNullable<StudioV2State["usage"]> }
  | { type: "TOAST"; message: string | null };

export function studioReducer(
  state: StudioV2State,
  action: StudioAction
): StudioV2State {
  switch (action.type) {
    case "RESET":
      // מד השימוש נשמר — הוא נתון יומי, לא נתון של העבודה
      return { ...INITIAL_STUDIO_STATE, usage: state.usage };

    case "RESTORE":
      return { ...action.state, usage: state.usage };

    case "SET_FLOW":
      return {
        ...state,
        flow: action.flow,
        cutout: { ...INITIAL_STUDIO_STATE.cutout },
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
        error: null,
      };

    case "SOURCE_UPLOADED": {
      const priorOriginal =
        action.keepOriginal && state.source.originalUrl
          ? state.source.originalUrl
          : action.url;
      return {
        ...state,
        source: {
          url: action.url,
          originalUrl: priorOriginal,
          kind: action.kind,
          duration: action.duration ?? null,
        },
        cutout: { ...INITIAL_STUDIO_STATE.cutout },
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
        selectedAttemptId: action.keepOriginal
          ? null
          : state.selectedAttemptId,
        error: null,
        busyAction: null,
      };
    }

    case "SET_PRESET": {
      if (state.preview.presetId === action.presetId) {
        return { ...state, stylePreset: action.presetId };
      }
      // פריסט חדש מבטל רק את התצוגה המקדימה — התוצאה הקודמת נשארת לפרסום
      return {
        ...state,
        stylePreset: action.presetId,
        preview: { ...INITIAL_STUDIO_STATE.preview },
      };
    }

    case "SET_CUSTOM_PROMPT":
      return { ...state, customPrompt: action.value };
    case "SET_VIDEO_PROMPT":
      return { ...state, videoPrompt: action.value };
    case "SET_VIDEO_DURATION":
      return { ...state, videoDuration: action.value };
    case "SET_VIDEO_MOTION":
      return { ...state, videoMotion: action.value };
    case "SET_VIDEO_NATIVE_AUDIO":
      return { ...state, videoNativeAudio: action.value };
    case "SET_VIDEO_MULTISHOT":
      return { ...state, videoMultiShot: action.value };
    case "SET_USE_AI_BACKGROUND": {
      if (action.value === state.useAiBackground) {
        return state;
      }
      return {
        ...state,
        useAiBackground: action.value,
        aiEngines: syncEnginesForUseAiBackground(state.aiEngines, action.value),
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
      };
    }
    case "SET_HIGH_QUALITY_BACKGROUND":
      return { ...state, highQualityBackground: action.value };
    case "SET_ENGINES": {
      let useAiBackground = state.useAiBackground;
      if (state.flow === "catalog") {
        if (action.engines.background === "procedural") {
          useAiBackground = false;
        } else if (isAiBackgroundProvider(action.engines.background)) {
          useAiBackground = true;
        }
      }
      const modeChanged = useAiBackground !== state.useAiBackground;
      return {
        ...state,
        aiEngines: action.engines,
        useAiBackground,
        ...(modeChanged
          ? {
              preview: { ...INITIAL_STUDIO_STATE.preview },
              result: { ...INITIAL_STUDIO_STATE.result },
            }
          : {}),
      };
    }
    case "SET_PRODUCT_TITLE":
      return { ...state, productTitle: action.value };
    case "SET_PRODUCT_PRICE":
      return { ...state, productPrice: action.value };

    case "ACTION_STARTED":
      return {
        ...state,
        busyAction: action.action,
        error: null,
        ...(action.action === "cutout"
          ? { cutout: { ...state.cutout, status: "running" as const } }
          : {}),
        ...(action.action === "preview"
          ? { preview: { ...state.preview, status: "running" as const } }
          : {}),
        ...(action.action === "image" || action.action === "video"
          ? { result: { ...state.result, status: "running" as const } }
          : {}),
      };

    case "CUTOUT_DONE":
      return {
        ...state,
        busyAction: null,
        cutout: { url: action.url, status: "done", cached: action.cached },
        // בידוד חדש מבטל תצוגה ותוצאה שנבנו על הבידוד הקודם
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
      };

    case "PREVIEW_DONE":
      return {
        ...state,
        busyAction: null,
        selectedAttemptId: null,
        preview: {
          url: action.url,
          kind: action.kind,
          status: "done",
          presetId: state.stylePreset,
        },
        attempts: appendAttempt(state.attempts, {
          url: action.url,
          kind: action.kind,
          label: action.label ?? "תצוגה מקדימה",
          free: action.free ?? true,
        }),
      };

    case "PREVIEW_AND_RESULT_DONE": {
      const label = action.label ?? "תמונה מוכנה";
      return {
        ...state,
        busyAction: null,
        selectedAttemptId: null,
        preview: {
          url: action.url,
          kind: action.kind,
          status: "done",
          presetId: state.stylePreset,
        },
        result: {
          url: action.url,
          kind: action.kind,
          status: "done",
          provider: action.provider ?? "procedural",
        },
        attempts: appendAttempt(state.attempts, {
          url: action.url,
          kind: action.kind,
          label,
          free: action.free ?? true,
        }),
      };
    }

    case "RESULT_DONE":
      return {
        ...state,
        busyAction: null,
        selectedAttemptId: null,
        result: {
          url: action.url,
          kind: action.kind,
          status: "done",
          provider: action.provider ?? null,
        },
        attempts: appendAttempt(state.attempts, {
          url: action.url,
          kind: action.kind,
          label: action.label ?? "תוצאה",
          free: action.free ?? false,
        }),
      };

    case "ATTEMPT_ADDED":
      return {
        ...state,
        attempts: appendAttempt(state.attempts, {
          url: action.url,
          kind: action.kind,
          label: action.label,
          free: action.free,
        }),
      };

    case "SELECT_ATTEMPT":
      return { ...state, selectedAttemptId: action.id };

    case "DELETE_ATTEMPT":
      return {
        ...state,
        attempts: state.attempts.filter((a) => a.id !== action.id),
        selectedAttemptId:
          state.selectedAttemptId === action.id
            ? null
            : state.selectedAttemptId,
      };

    case "USE_ATTEMPT_AS_RESULT": {
      const attempt = state.attempts.find((a) => a.id === action.id);
      if (!attempt) return state;
      return {
        ...state,
        selectedAttemptId: null,
        result: {
          url: attempt.url,
          kind: attempt.kind,
          status: "done",
          provider: null,
        },
      };
    }

    case "SET_RESULT_ASPECT":
      return { ...state, resultAspect: action.value };

    case "SET_SOURCE_ADJ":
      return { ...state, sourceAdj: action.value };

    case "SET_VIDEO_ADJ":
      return { ...state, videoAdj: action.value };

    case "CONTINUE_FROM_RESULT": {
      if (!state.result.url || state.result.kind !== "image") return state;
      return {
        ...state,
        source: {
          url: state.result.url,
          originalUrl: state.source.originalUrl ?? state.result.url,
          kind: "image",
          duration: null,
        },
        cutout: { ...INITIAL_STUDIO_STATE.cutout },
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
        selectedAttemptId: null,
        error: null,
      };
    }

    /**
     * "עבודה ישירה, ללא בידוד" — התמונה/וידאו שהועלו הופכים לתוצאה
     * הנוכחית כמו-שהם, בלי לעבור הסרת רקע/הרכבה. מאפשר וידאו ופרסום
     * מיידיים מכל תמונה, כולל כאלה שכבר בעלות רקע מוגמר.
     */
    case "USE_SOURCE_DIRECTLY": {
      if (!state.source.url) return state;
      return {
        ...state,
        selectedAttemptId: null,
        result: {
          url: state.source.url,
          kind: state.source.kind,
          status: "done",
          provider: "original",
        },
        attempts: appendAttempt(state.attempts, {
          url: state.source.url,
          kind: state.source.kind,
          label: "מקור (ללא בידוד)",
          free: true,
        }),
      };
    }

    case "ACTION_FAILED":
      return {
        ...state,
        busyAction: null,
        error: action.error,
        ...(action.error.action === "cutout"
          ? { cutout: { ...state.cutout, status: "error" as const } }
          : {}),
        ...(action.error.action === "preview"
          ? { preview: { ...state.preview, status: "error" as const } }
          : {}),
        ...(action.error.action === "image" || action.error.action === "video"
          ? { result: { ...state.result, status: "error" as const } }
          : {}),
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "USAGE_LOADED":
      return { ...state, usage: action.usage };

    case "TOAST":
      return { ...state, toast: action.message };

    default:
      return state;
  }
}
