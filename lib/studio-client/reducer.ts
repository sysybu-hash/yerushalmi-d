import type { AiEngineConfig } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import type { StudioVideoMotionMode } from "@/lib/studio-types";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";
import {
  INITIAL_STUDIO_STATE,
  type StudioBusyAction,
  type StudioErrorInfo,
  type StudioFlow,
  type StudioSourceKind,
  type StudioV2State,
} from "./state";

export type StudioAction =
  | { type: "RESET" }
  | { type: "RESTORE"; state: StudioV2State }
  | { type: "SET_FLOW"; flow: StudioFlow }
  | {
      type: "SOURCE_UPLOADED";
      url: string;
      kind: StudioSourceKind;
      duration?: number | null;
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
  | { type: "SET_ADVANCED_OPEN"; open: boolean }
  | { type: "SET_PRODUCT_TITLE"; value: string }
  | { type: "SET_PRODUCT_PRICE"; value: string }
  | { type: "ACTION_STARTED"; action: Exclude<StudioBusyAction, null> }
  | { type: "CUTOUT_DONE"; url: string; cached: boolean }
  | { type: "PREVIEW_DONE"; url: string; kind: StudioSourceKind }
  | {
      type: "RESULT_DONE";
      url: string;
      kind: StudioSourceKind;
      provider?: string | null;
    }
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
        // מעבר זרימה מנקה תצוגה ותוצאה — הן תלויות-זרימה
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
        error: null,
      };

    case "SOURCE_UPLOADED":
      return {
        ...state,
        source: {
          url: action.url,
          kind: action.kind,
          duration: action.duration ?? null,
        },
        cutout: { ...INITIAL_STUDIO_STATE.cutout },
        preview: { ...INITIAL_STUDIO_STATE.preview },
        result: { ...INITIAL_STUDIO_STATE.result },
        error: null,
        busyAction: null,
      };

    case "SET_PRESET":
      return {
        ...state,
        stylePreset: action.presetId,
        // פריסט חדש מבטל תצוגה ותוצאה ישנות
        preview:
          state.preview.presetId === action.presetId
            ? state.preview
            : { ...INITIAL_STUDIO_STATE.preview },
      };

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
    case "SET_USE_AI_BACKGROUND":
      return { ...state, useAiBackground: action.value };
    case "SET_HIGH_QUALITY_BACKGROUND":
      return { ...state, highQualityBackground: action.value };
    case "SET_ENGINES":
      return { ...state, aiEngines: action.engines };
    case "SET_ADVANCED_OPEN":
      return { ...state, advancedOpen: action.open };
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
        preview: {
          url: action.url,
          kind: action.kind,
          status: "done",
          presetId: state.stylePreset,
        },
      };

    case "RESULT_DONE":
      return {
        ...state,
        busyAction: null,
        result: {
          url: action.url,
          kind: action.kind,
          status: "done",
          provider: action.provider ?? null,
        },
      };

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
