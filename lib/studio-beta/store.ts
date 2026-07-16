import { create } from "zustand";
import {
  getBackgroundEngine,
  getVideoEngine,
  type BackgroundEngineId,
  type VideoEngineId,
} from "@/lib/studio-beta/engines";
import { BACKGROUND_PRESETS } from "@/lib/studio-beta/backgrounds";
import type { SourcePrepPresetId } from "@/lib/studio-beta/source-prep-pipeline";
import {
  getEffectiveSourceUrl,
  trimVideo,
  muteVideo,
  enhanceUploadedVideo,
  type SourceAspect,
  type SourceAdjustments,
  type VideoMotionId,
  type MusicStyleId,
  VIDEO_MOTION_PRESETS,
} from "@/lib/studio-beta/cloudinary-transform";
import {
  saveStudioBetaAsset,
  saveStudioBetaProject,
} from "@/app/(ai-studio)/studio-beta/actions";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import type { MultiShotTemplateId } from "@/lib/studio-multishot";
import { videoFrameJpgUrl } from "@/lib/cloudinary-url";
import {
  FALLBACK_ILS_PER_USD,
  type StudioCurrency,
} from "@/lib/studio-beta/currency";

/** תמונת המקור בפועל (אחרי חיתוך/כיוונון) — לשימוש בתצוגה מקדימה וב-payload */
export function selectEffectiveSourceUrl(state: {
  sourceImageUrl: string | null;
  sourceAspect: SourceAspect;
  sourceAdjustments: SourceAdjustments;
}): string | null {
  if (!state.sourceImageUrl) return null;
  return getEffectiveSourceUrl(
    state.sourceImageUrl,
    state.sourceAspect,
    state.sourceAdjustments
  );
}

type StepStatus = "idle" | "loading" | "done" | "error";

/** תקרת מספר ניסיונות שמורים במסילה — קטן מ-40 של v2, בטא נשאר קליל יותר */
const MAX_ATTEMPTS = 20;

type Attempt = {
  id: string;
  kind: "background" | "video";
  url: string;
  label: string;
  engine: string;
  modelId: string | null;
  costUsd: number;
  mediaKind?: "video" | "gif";
  createdAt: number;
};

/** מיקום/גודל ידניים של התכשיט על הרקע — אותה נוסחה בדיוק בקליינט ובשרת */
export type PlacementState = { scale: number; offsetX: number; offsetY: number };

function initialPlacementState(): PlacementState {
  return { scale: 1, offsetX: 0, offsetY: 0 };
}

/** זום/פאן ידניים על שכבת הרקע עצמה — offsetX/offsetY הם 0..1 כמו background-position ב-CSS */
export type BackdropPlacementState = { scale: number; offsetX: number; offsetY: number };

function initialBackdropPlacementState(): BackdropPlacementState {
  return { scale: 1, offsetX: 0.5, offsetY: 0.5 };
}

type BackgroundState = {
  engine: BackgroundEngineId;
  presetId: string | null;
  customPrompt: string;
  placement: PlacementState;
  backdropPlacement: BackdropPlacementState;
  url: string | null;
  modelId: string | null;
  costUsd: number;
  usedCutout: boolean;
  fallbackNote: string | null;
  status: StepStatus;
  error: string | null;
};

type VideoTrimState = {
  startSec: number | null;
  endSec: number | null;
  mute: boolean;
  /** שיפור וידאו חינמי (Cloudinary — חידוד ומניעת רעש), לא AI */
  enhance: boolean;
};

type VideoState = {
  engine: VideoEngineId;
  durationSec: StudioVideoDurationSec;
  customPrompt: string;
  /** מוחל רק כשהמנוע Kling — לשאר המנועים אין תמיכה בפרמטר הזה */
  negativePrompt: string;
  /** אודיו טבעי שנוצר ע"י המודל — Kling בלבד */
  generateAudio: boolean;
  /** תבנית multi-shot (כמה צילומים בקליפ אחד) — Kling בלבד */
  multiShotTemplate: MultiShotTemplateId;
  /** סגנונות תנועת Ken Burns — המנוע החינמי (cloudinary-preserve) בלבד, ניתנים לשילוב */
  motion: VideoMotionId[];
  /** מוזיקת רקע חינמית — המנוע החינמי (cloudinary-preserve) בלבד */
  musicStyle: MusicStyleId;
  url: string | null;
  modelId: string | null;
  costUsd: number;
  mediaKind: "video" | "gif" | null;
  status: StepStatus;
  error: string | null;
  trim: VideoTrimState;
  /** פעולת "שיפור וידאו ב-AI" (Veo, בתשלום) — נפרד מ-status הכללי כדי לא להתנגש עם יצירה */
  aiEnhance: VideoAiEnhanceState;
};

type VideoAiEnhanceState = { status: StepStatus; error: string | null };

type SaveState = {
  status: StepStatus;
  error: string | null;
  assetId: number | null;
};

type CutoutState = {
  status: StepStatus;
  url: string | null;
  costUsd: number;
  error: string | null;
  /** אישור ידני של המשתמש לפני שממשיכים להרכבה */
  approved: boolean;
};

type SourcePrepState = {
  status: StepStatus;
  error: string | null;
  costUsd: number;
  appliedLabel: string | null;
};

type IdentifyState = {
  status: StepStatus;
  description: string | null;
  modelId: string | null;
  costUsd: number;
  error: string | null;
};

/**
 * פאס הריאליזם (ControlNet) — רץ אוטומטית רק בשרשרת ה-Auto-Magic.
 * בהצלחה התוצאה מחליפה את background.url (וה-composite הקודם נשאר במסילה).
 */
type RealismState = {
  status: StepStatus;
  url: string | null;
  costUsd: number;
  error: string | null;
};

export type AutoMagicStage = "identify" | "cutout" | "background" | "realism";

/** מצב שרשרת ה-Auto-Magic — transient, לא נשמר בפרויקט */
type AutoMagicState = {
  status: StepStatus;
  currentStage: AutoMagicStage | null;
  error: string | null;
};

type OutputChoice = "image" | "video" | null;

export type SourceKind = "image" | "video";

/** תת-קבוצת ה-store הניתנת לשמירה/שחזור כפרויקט (בלי פעולות/פונקציות) */
export type StudioBetaProjectState = {
  currentStep: 1 | 2 | 3 | 4;
  maxStepReached: 1 | 2 | 3 | 4;
  sourceImageUrl: string | null;
  /** תמונה או וידאו — בוידאו-מקור, sourceImageUrl הוא פריים מחולץ, לא הוידאו עצמו */
  sourceKind: SourceKind;
  /** הוידאו הגולמי שהועלה (רק כש-sourceKind הוא video) — לאפשרות "המשך עם המקורי" */
  originalVideoUrl: string | null;
  /** התמונה כפי שהועלתה במקור — לפני כל הכנת מקור ב-AI, לצורך "שחזר למקור" */
  originalSourceImageUrl: string | null;
  sourceAspect: SourceAspect;
  sourceAdjustments: SourceAdjustments;
  sourcePrep: SourcePrepState;
  identify: IdentifyState;
  cutout: CutoutState;
  background: BackgroundState;
  realism: RealismState;
  outputChoice: OutputChoice;
  video: VideoState;
  imageSave: SaveState;
  videoSave: SaveState;
  sessionCostUsd: number;
  attempts: Attempt[];
};

function initialBackgroundState(): BackgroundState {
  return {
    engine: "gemini-compose",
    presetId: BACKGROUND_PRESETS[0].id,
    customPrompt: "",
    placement: initialPlacementState(),
    backdropPlacement: initialBackdropPlacementState(),
    url: null,
    modelId: null,
    costUsd: 0,
    usedCutout: false,
    fallbackNote: null,
    status: "idle",
    error: null,
  };
}

function initialVideoTrim(): VideoTrimState {
  return { startSec: null, endSec: null, mute: false, enhance: false };
}

function initialVideoAiEnhanceState(): VideoAiEnhanceState {
  return { status: "idle", error: null };
}

function initialVideoState(): VideoState {
  return {
    engine: "cloudinary-preserve",
    durationSec: 8,
    customPrompt: "",
    negativePrompt: "",
    generateAudio: false,
    multiShotTemplate: "none",
    motion: ["zoom-in"],
    musicStyle: "none",
    url: null,
    modelId: null,
    costUsd: 0,
    mediaKind: null,
    status: "idle",
    error: null,
    trim: initialVideoTrim(),
    aiEnhance: initialVideoAiEnhanceState(),
  };
}

function initialSaveState(): SaveState {
  return { status: "idle", error: null, assetId: null };
}

function initialSourceAdjustments(): SourceAdjustments {
  return { brightness: 0, saturation: 0, contrast: 0, autoEnhance: false };
}

function initialCutoutState(): CutoutState {
  return { status: "idle", url: null, costUsd: 0, error: null, approved: false };
}

function initialSourcePrepState(): SourcePrepState {
  return { status: "idle", error: null, costUsd: 0, appliedLabel: null };
}

function initialIdentifyState(): IdentifyState {
  return { status: "idle", description: null, modelId: null, costUsd: 0, error: null };
}

function initialRealismState(): RealismState {
  return { status: "idle", url: null, costUsd: 0, error: null };
}

function initialAutoMagicState(): AutoMagicState {
  return { status: "idle", currentStage: null, error: null };
}

type StudioBetaState = {
  currentStep: 1 | 2 | 3 | 4;
  sourceImageUrl: string | null;
  sourceKind: SourceKind;
  originalVideoUrl: string | null;
  originalSourceImageUrl: string | null;
  resetNotice: string | null;

  sourceAspect: SourceAspect;
  sourceAdjustments: SourceAdjustments;
  sourcePrep: SourcePrepState;
  identify: IdentifyState;
  cutout: CutoutState;

  background: BackgroundState;
  realism: RealismState;
  autoMagic: AutoMagicState;
  outputChoice: OutputChoice;
  video: VideoState;

  imageSave: SaveState;
  videoSave: SaveState;

  sessionCostUsd: number;

  /** העדפת תצוגה בלבד — לא נשמר בפרויקט, לא משנה שום חישוב עלות פנימי */
  currency: StudioCurrency;
  /** שער דולר→שקל בפועל — נטען פעם אחת מ-/api/studio-beta/exchange-rate */
  ilsPerUsd: number;

  /** מסילת ניסיונות — כל רקע/וידאו שנוצר בהצלחה, לא רק התוצאה הנוכחית */
  attempts: Attempt[];

  /** מזהה הפרויקט השמור המשויך לעבודה הנוכחית, אם נטען/נשמר כבר */
  currentProjectId: number | null;

  /** השלב הרחוק ביותר שכבר הושג — קובע אילו לשוניות בכותרת ניתנות ללחיצה */
  maxStepReached: 1 | 2 | 3 | 4;

  selectAttempt: (id: string) => void;
  deleteAttempt: (id: string) => void;

  setSourceImage: (
    url: string,
    kind?: SourceKind,
    frameOffsetSec?: number
  ) => void;
  setCurrency: (currency: StudioCurrency) => void;
  setIlsPerUsd: (rate: number) => void;
  /** ממשיכים עם הוידאו הגולמי שהועלה כפי שהוא, בלי יצירה מחדש */
  continueWithOriginalVideo: () => void;
  dismissResetNotice: () => void;
  hydrateFromProject: (project: {
    id: number;
    state: StudioBetaProjectState;
  }) => void;

  setSourceAspect: (aspect: SourceAspect) => void;
  setSourceAdjustment: (
    key: "brightness" | "saturation" | "contrast",
    value: number
  ) => void;
  setAutoEnhance: (enabled: boolean) => void;
  resetSourceAdjustments: () => void;

  runSourcePrep: (
    presetId: SourcePrepPresetId | null,
    customPrompt: string | null,
    label: string
  ) => Promise<void>;
  revertToOriginalSource: () => void;

  runIdentify: () => Promise<void>;

  runCutout: () => Promise<void>;
  retryCutout: () => Promise<void>;
  approveCutout: () => void;

  setBackgroundEngine: (engine: BackgroundEngineId) => void;
  setBackgroundPreset: (presetId: string) => void;
  setBackgroundCustomPrompt: (text: string) => void;
  setBackgroundPlacement: (patch: Partial<PlacementState>) => void;
  setBackdropPlacement: (patch: Partial<BackdropPlacementState>) => void;
  runBackground: () => Promise<void>;
  /** פאס ריאליזם (ControlNet) על ה-composite — נקרא מתוך runAutoMagic */
  runRealism: () => Promise<void>;
  /** שרשרת בלחיצה אחת: זיהוי → בידוד (אישור אוטומטי) → רקע+הרכבה → ריאליזם */
  runAutoMagic: (engineOverride?: BackgroundEngineId) => Promise<void>;
  approveBackground: () => void;
  goToStep: (step: 1 | 2 | 3 | 4) => void;

  chooseOutput: (choice: OutputChoice) => void;
  continueToVideo: () => void;
  setVideoEngine: (engine: VideoEngineId) => void;
  setVideoDuration: (sec: StudioVideoDurationSec) => void;
  setVideoCustomPrompt: (text: string) => void;
  setVideoNegativePrompt: (text: string) => void;
  setVideoGenerateAudio: (enabled: boolean) => void;
  setVideoMultiShot: (template: MultiShotTemplateId) => void;
  toggleVideoMotion: (id: VideoMotionId) => void;
  setVideoMusicStyle: (style: MusicStyleId) => void;
  setVideoTrim: (startSec: number | null, endSec: number | null) => void;
  setVideoMute: (mute: boolean) => void;
  setVideoEnhance: (enhance: boolean) => void;
  runVideo: () => Promise<void>;
  enhanceVideoAi: () => Promise<void>;

  saveImageToLibrary: (title?: string) => Promise<void>;
  saveVideoToLibrary: (title?: string) => Promise<void>;
  startOver: () => void;
};

export const useStudioBetaStore = create<StudioBetaState>((set, get) => {
  /**
   * שמירת מצב עבודה אוטומטית אחרי כל שלב משמעותי — כדי שאפשר יהיה
   * לחזור ולהמשיך פרויקט מ"פרויקטים קודמים". לא חוסמת את ה-UI (fire-and-forget)
   * ולא זורקת — כשל שמירה לא אמור להפריע להמשך העבודה.
   */
  const persistProject = async () => {
    const state = get();
    if (!state.sourceImageUrl) return;
    try {
      const snapshot: StudioBetaProjectState = {
        currentStep: state.currentStep,
        maxStepReached: state.maxStepReached,
        sourceImageUrl: state.sourceImageUrl,
        sourceKind: state.sourceKind,
        originalVideoUrl: state.originalVideoUrl,
        originalSourceImageUrl: state.originalSourceImageUrl,
        sourceAspect: state.sourceAspect,
        sourceAdjustments: state.sourceAdjustments,
        sourcePrep: state.sourcePrep,
        identify: state.identify,
        cutout: state.cutout,
        background: state.background,
        realism: state.realism,
        outputChoice: state.outputChoice,
        video: state.video,
        imageSave: state.imageSave,
        videoSave: state.videoSave,
        sessionCostUsd: state.sessionCostUsd,
        attempts: state.attempts,
      };
      // sourceImageUrl הוא תמיד תמונה תקינה עכשיו — גם בוידאו-מקור זה הפריים המחולץ, לא הוידאו עצמו
      const thumbnailUrl = state.background.url ?? state.sourceImageUrl;
      const result = await saveStudioBetaProject({
        id: state.currentProjectId,
        sourceImageUrl: state.sourceImageUrl,
        thumbnailUrl,
        state: snapshot,
      });
      set({ currentProjectId: result.id });
    } catch {
      // שמירת פרויקט אינה קריטית לזרימת העבודה — מתעלמים משגיאה
    }
  };

  /** מוסיף ניסיון חדש למסילה — דה-דופ לפי URL, תקרה MAX_ATTEMPTS */
  const pushAttempt = (attempt: Omit<Attempt, "id" | "createdAt">) => {
    set((s) => {
      if (s.attempts.some((a) => a.url === attempt.url)) return {};
      const next: Attempt = {
        ...attempt,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      return { attempts: [next, ...s.attempts].slice(0, MAX_ATTEMPTS) };
    });
  };

  return {
    currentStep: 1,
    sourceImageUrl: null,
    sourceKind: "image",
    originalVideoUrl: null,
    originalSourceImageUrl: null,
    resetNotice: null,

    sourceAspect: "original",
    sourceAdjustments: initialSourceAdjustments(),
    sourcePrep: initialSourcePrepState(),
    identify: initialIdentifyState(),
    cutout: initialCutoutState(),

    background: initialBackgroundState(),
    realism: initialRealismState(),
    autoMagic: initialAutoMagicState(),
    outputChoice: null,
    video: initialVideoState(),

    imageSave: initialSaveState(),
    videoSave: initialSaveState(),

    sessionCostUsd: 0,
    currency: "usd",
    ilsPerUsd: FALLBACK_ILS_PER_USD,
    attempts: [],
    currentProjectId: null,
    maxStepReached: 1,

    selectAttempt: (id) =>
      set((state) => {
        const attempt = state.attempts.find((a) => a.id === id);
        if (!attempt) return {};
        if (attempt.kind === "background") {
          return {
            background: {
              ...state.background,
              status: "done",
              url: attempt.url,
              engine: attempt.engine as BackgroundEngineId,
              modelId: attempt.modelId,
              costUsd: attempt.costUsd,
            },
          };
        }
        return {
          video: {
            ...state.video,
            status: "done",
            url: attempt.url,
            engine: attempt.engine as VideoEngineId,
            modelId: attempt.modelId,
            costUsd: attempt.costUsd,
            mediaKind: attempt.mediaKind ?? "video",
          },
        };
      }),

    deleteAttempt: (id) =>
      set((state) => ({
        attempts: state.attempts.filter((a) => a.id !== id),
      })),

    setSourceImage: (url, kind = "image", frameOffsetSec = 0) => {
      // וידאו-מקור: מחלצים פריים (לפי הפריים שנבחר בבורר) ומטפלים בו כמו
      // בתמונה רגילה — רקע/בידוד/יצירת וידאו-AI כולם זמינים; הוידאו הגולמי
      // נשמר בצד ל"המשך עם המקורי"
      const effectiveUrl =
        kind === "video" ? videoFrameJpgUrl(url, frameOffsetSec) : url;
      set((state) => ({
        sourceImageUrl: effectiveUrl,
        sourceKind: kind,
        originalVideoUrl: kind === "video" ? url : null,
        originalSourceImageUrl: effectiveUrl,
        currentStep: 2,
        maxStepReached: 2,
        currentProjectId: null,
        resetNotice:
          state.sourceImageUrl !== null
            ? kind === "video"
              ? "הוידאו הוחלף"
              : "התמונה הוחלפה — הרקע והווידאו אופסו"
            : null,
        sourceAspect: "original",
        sourceAdjustments: initialSourceAdjustments(),
        sourcePrep: initialSourcePrepState(),
        identify: initialIdentifyState(),
        cutout: initialCutoutState(),
        background: initialBackgroundState(),
        realism: initialRealismState(),
        autoMagic: initialAutoMagicState(),
        outputChoice: null,
        video: initialVideoState(),
        attempts: [],
        imageSave: initialSaveState(),
        videoSave: initialSaveState(),
      }));
      void persistProject();
    },

    continueWithOriginalVideo: () => {
      const originalVideoUrl = get().originalVideoUrl;
      if (!originalVideoUrl) return;
      set((s) => ({
        video: {
          ...initialVideoState(),
          url: originalVideoUrl,
          mediaKind: "video",
          status: "done",
        },
        videoSave: initialSaveState(),
        currentStep: 4,
        maxStepReached: Math.max(s.maxStepReached, 4) as 1 | 2 | 3 | 4,
      }));
      void persistProject();
    },

    setCurrency: (currency) => set({ currency }),
    setIlsPerUsd: (rate) => set({ ilsPerUsd: rate }),

    dismissResetNotice: () => set({ resetNotice: null }),

    /**
     * מיזוג מוגן-ברירת-מחדל, לא spread גולמי: פרויקטים שנשמרו לפני
     * שדה חדש נוסף (למשל sourceAspect/videoTrim) יקבלו את ברירת המחדל
     * הנוכחית של אותו שדה במקום undefined.
     */
    hydrateFromProject: (project) => {
      const s = project.state;
      set({
        currentProjectId: project.id,
        resetNotice: null,
        currentStep: s.currentStep,
        maxStepReached: s.maxStepReached ?? s.currentStep,
        sourceImageUrl: s.sourceImageUrl,
        sourceKind: s.sourceKind ?? "image",
        // פרויקטים ישנים (לפני חילוץ-פריים) שמרו את הוידאו הגולמי כ-sourceImageUrl עצמו
        originalVideoUrl:
          s.originalVideoUrl ?? (s.sourceKind === "video" ? s.sourceImageUrl : null),
        originalSourceImageUrl: s.originalSourceImageUrl ?? s.sourceImageUrl,
        sourceAspect: s.sourceAspect ?? "original",
        sourceAdjustments: {
          ...initialSourceAdjustments(),
          ...s.sourceAdjustments,
        },
        sourcePrep: { ...initialSourcePrepState(), ...s.sourcePrep },
        identify: { ...initialIdentifyState(), ...s.identify },
        cutout: { ...initialCutoutState(), ...s.cutout },
        outputChoice: s.outputChoice,
        sessionCostUsd: s.sessionCostUsd,
        attempts: s.attempts ?? [],
        background: { ...initialBackgroundState(), ...s.background },
        realism: { ...initialRealismState(), ...s.realism },
        autoMagic: initialAutoMagicState(),
        video: {
          ...initialVideoState(),
          ...s.video,
          // גרסאות שמורות ישנות (לפני שהוחלף למערך בר-שילוב) שמרו כאן מחרוזת בודדת
          motion: Array.isArray(s.video?.motion)
            ? s.video.motion
            : s.video?.motion
              ? [s.video.motion as unknown as VideoMotionId]
              : initialVideoState().motion,
          trim: { ...initialVideoTrim(), ...s.video?.trim },
          aiEnhance: { ...initialVideoAiEnhanceState(), ...s.video?.aiEnhance },
        },
        imageSave: { ...initialSaveState(), ...s.imageSave },
        videoSave: { ...initialSaveState(), ...s.videoSave },
      });
    },

    setSourceAspect: (aspect) => set({ sourceAspect: aspect }),

    setSourceAdjustment: (key, value) =>
      set((state) => ({
        sourceAdjustments: { ...state.sourceAdjustments, [key]: value },
      })),

    setAutoEnhance: (enabled) =>
      set((state) => ({
        sourceAdjustments: { ...state.sourceAdjustments, autoEnhance: enabled },
      })),

    resetSourceAdjustments: () =>
      set({ sourceAdjustments: initialSourceAdjustments() }),

    /**
     * הכנת מקור ב-AI (השלמת קצוות/ניקוי רקע/חידוד) — מחליפה את
     * sourceImageUrl בתוצאה, אבל originalSourceImageUrl נשאר כפי שהועלה
     * במקור כדי לאפשר "שחזר למקור" בכל שלב.
     */
    runSourcePrep: async (presetId, customPrompt, label) => {
      const state = get();
      if (!state.sourceImageUrl) return;
      set((s) => ({
        sourcePrep: { ...s.sourcePrep, status: "loading", error: null },
      }));
      try {
        const response = await fetch("/api/studio-beta/source-prep", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceImageUrl: state.sourceImageUrl,
            presetId,
            customPrompt,
          }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "הכנת המקור נכשלה");
        set((s) => ({
          sourceImageUrl: json.resultUrl,
          sourcePrep: {
            status: "done",
            error: null,
            costUsd: json.costUsd ?? 0,
            appliedLabel: label,
          },
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
      } catch (error) {
        set((s) => ({
          sourcePrep: {
            ...s.sourcePrep,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    revertToOriginalSource: () =>
      set((state) => {
        if (!state.originalSourceImageUrl) return {};
        return {
          sourceImageUrl: state.originalSourceImageUrl,
          sourcePrep: initialSourcePrepState(),
        };
      }),

    /** זיהוי תמונה ב-AI — תיאור חופשי בעברית, לא משנה שום דבר בתמונה עצמה */
    runIdentify: async () => {
      const state = get();
      if (!state.sourceImageUrl) return;
      set((s) => ({ identify: { ...s.identify, status: "loading", error: null } }));
      try {
        const response = await fetch("/api/studio-beta/identify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceImageUrl: state.sourceImageUrl }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "זיהוי התמונה נכשל");
        set((s) => ({
          identify: {
            status: "done",
            description: json.description,
            modelId: json.modelId ?? null,
            costUsd: json.costUsd ?? 0,
            error: null,
          },
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
      } catch (error) {
        set((s) => ({
          identify: {
            ...s.identify,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    /** שער בידוד ידני — נעשה כפעולה עצמאית, לפני הרכבת הרקע */
    runCutout: async () => {
      const state = get();
      if (!state.sourceImageUrl) return;
      const effectiveSourceUrl = getEffectiveSourceUrl(
        state.sourceImageUrl,
        state.sourceAspect,
        state.sourceAdjustments
      );
      set((s) => ({
        cutout: { ...s.cutout, status: "loading", error: null, approved: false },
      }));
      try {
        const response = await fetch("/api/studio-beta/cutout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceImageUrl: effectiveSourceUrl }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "הבידוד נכשל");
        set((s) => ({
          cutout: {
            status: "done",
            url: json.url,
            costUsd: json.costUsd ?? 0,
            error: null,
            approved: false,
          },
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
      } catch (error) {
        set((s) => ({
          cutout: {
            ...s.cutout,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    retryCutout: async () => {
      await get().runCutout();
    },

    approveCutout: () =>
      set((state) => ({ cutout: { ...state.cutout, approved: true } })),

    setBackgroundEngine: (engine) =>
      set((state) => ({ background: { ...state.background, engine } })),

    setBackgroundPreset: (presetId) =>
      set((state) => ({ background: { ...state.background, presetId } })),

    setBackgroundCustomPrompt: (text) =>
      set((state) => ({
        background: { ...state.background, customPrompt: text },
      })),

    setBackgroundPlacement: (patch) =>
      set((state) => ({
        background: {
          ...state.background,
          placement: { ...state.background.placement, ...patch },
        },
      })),

    setBackdropPlacement: (patch) =>
      set((state) => ({
        background: {
          ...state.background,
          backdropPlacement: { ...state.background.backdropPlacement, ...patch },
        },
      })),

    runBackground: async () => {
      const state = get();
      if (!state.sourceImageUrl) return;
      const effectiveSourceUrl = getEffectiveSourceUrl(
        state.sourceImageUrl,
        state.sourceAspect,
        state.sourceAdjustments
      );
      const engineDef = getBackgroundEngine(state.background.engine);
      const useApprovedCutout =
        Boolean(engineDef?.usesCutout) &&
        state.cutout.status === "done" &&
        state.cutout.approved;
      set((s) => ({ background: { ...s.background, status: "loading", error: null } }));
      try {
        const response = await fetch("/api/studio-beta/background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceImageUrl: effectiveSourceUrl,
            engine: state.background.engine,
            presetId: state.background.presetId,
            customPrompt: state.background.customPrompt || null,
            cutoutUrl: useApprovedCutout ? state.cutout.url : null,
            placement: state.background.placement,
            backdropPlacement: state.background.backdropPlacement,
            sourceAspect: state.sourceAspect,
          }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "יצירת הרקע נכשלה");
        set((s) => ({
          background: {
            ...s.background,
            status: "done",
            url: json.resultUrl,
            modelId: json.modelId,
            costUsd: json.costUsd ?? 0,
            usedCutout: Boolean(json.usedCutout),
            fallbackNote: json.fallbackNote ?? null,
          },
          // composite חדש מבטל פאס ריאליזם קודם — הוא רץ על התוצאה הישנה
          realism: initialRealismState(),
          imageSave: initialSaveState(),
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
        pushAttempt({
          kind: "background",
          url: json.resultUrl,
          label: engineDef?.label ?? state.background.engine,
          engine: state.background.engine,
          modelId: json.modelId ?? null,
          costUsd: json.costUsd ?? 0,
        });
        void persistProject();
      } catch (error) {
        set((s) => ({
          background: {
            ...s.background,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    /**
     * פאס ריאליזם (ControlNet) על ה-composite הנוכחי — התוצאה מחליפה את
     * background.url; ה-composite הקודם נשאר במסילת הניסיונות כ-rollback חינמי.
     */
    runRealism: async () => {
      const state = get();
      const compositeUrl = state.background.url;
      if (!compositeUrl) return;
      set((s) => ({ realism: { ...s.realism, status: "loading", error: null } }));
      try {
        const response = await fetch("/api/studio-beta/realism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            compositeUrl,
            presetId: state.background.presetId,
            customPrompt: state.background.customPrompt || null,
          }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "פאס הריאליזם נכשל");
        set((s) => ({
          realism: {
            status: "done",
            url: json.resultUrl,
            costUsd: json.costUsd ?? 0,
            error: null,
          },
          background: { ...s.background, url: json.resultUrl },
          imageSave: initialSaveState(),
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
        pushAttempt({
          kind: "background",
          url: json.resultUrl,
          label: "פאס ריאליזם",
          engine: state.background.engine,
          modelId: json.modelId ?? null,
          costUsd: json.costUsd ?? 0,
        });
        void persistProject();
      } catch (error) {
        set((s) => ({
          realism: {
            ...s.realism,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    /**
     * שרשרת Auto-Magic בלחיצה אחת. עקרונות הכשל:
     * זיהוי — תיאורי בלבד, כשל לא עוצר; בידוד — כשל לא עוצר (ל-pipeline
     * הרקע יש fallbacks משלו), הצלחה מאושרת אוטומטית; רקע — כשל עוצר;
     * ריאליזם — כשל מסומן כשגיאה אבל ה-composite נשאר תקף (הצלחה מדורגת).
     */
    runAutoMagic: async (engineOverride) => {
      const state = get();
      if (!state.sourceImageUrl) return;
      if (state.autoMagic.status === "loading") return;
      if (engineOverride) {
        set((s) => ({ background: { ...s.background, engine: engineOverride } }));
      }

      set({ autoMagic: { status: "loading", currentStage: "identify", error: null } });
      await get().runIdentify();

      set((s) => ({ autoMagic: { ...s.autoMagic, currentStage: "cutout" } }));
      await get().runCutout();
      if (get().cutout.status === "done") {
        // אישור אוטומטי בשרשרת — המשתמש רואה את התוצאה במסילה ויכול לתקן
        get().approveCutout();
      }

      set((s) => ({ autoMagic: { ...s.autoMagic, currentStage: "background" } }));
      await get().runBackground();
      if (get().background.status !== "done" || !get().background.url) {
        set({
          autoMagic: {
            status: "error",
            currentStage: "background",
            error: get().background.error ?? "יצירת הרקע נכשלה",
          },
        });
        return;
      }

      set((s) => ({ autoMagic: { ...s.autoMagic, currentStage: "realism" } }));
      await get().runRealism();
      if (get().realism.status !== "done") {
        set({
          autoMagic: {
            status: "error",
            currentStage: "realism",
            error:
              get().realism.error ??
              "פאס הריאליזם נכשל — התמונה המורכבת עדיין זמינה",
          },
        });
        return;
      }

      set({ autoMagic: { status: "done", currentStage: null, error: null } });
    },

    approveBackground: () => {
      const state = get();
      if (state.background.status !== "done") return;
      set((s) => ({ currentStep: 3, maxStepReached: Math.max(s.maxStepReached, 3) as 1 | 2 | 3 | 4 }));
    },

    /** ניווט אחורה/קדימה בין שלבים שכבר הושגו — משמש את כותרת השלבים ואת סנכרון ה-URL */
    goToStep: (step) =>
      set((state) => ({
        currentStep: Math.min(Math.max(step, 1), state.maxStepReached) as 1 | 2 | 3 | 4,
      })),

    chooseOutput: (choice) => {
      set((state) => {
        const nextStep = choice === "image" ? 4 : state.currentStep;
        return {
          outputChoice: choice,
          currentStep: nextStep,
          maxStepReached: Math.max(state.maxStepReached, nextStep) as 1 | 2 | 3 | 4,
        };
      });
      void persistProject();
    },

    /** ממשיכים ליצירת וידאו מהתוצאה המאושרת — גם אחרי שהתמונה כבר נשמרה */
    continueToVideo: () =>
      set({ currentStep: 3, outputChoice: "video" }),

    setVideoEngine: (engine) =>
      set((state) => ({ video: { ...state.video, engine } })),

    setVideoDuration: (sec) =>
      set((state) => ({ video: { ...state.video, durationSec: sec } })),

    setVideoCustomPrompt: (text) =>
      set((state) => ({ video: { ...state.video, customPrompt: text } })),

    setVideoNegativePrompt: (text) =>
      set((state) => ({ video: { ...state.video, negativePrompt: text } })),

    setVideoGenerateAudio: (enabled) =>
      set((state) => ({ video: { ...state.video, generateAudio: enabled } })),

    setVideoMultiShot: (template) =>
      set((state) => ({ video: { ...state.video, multiShotTemplate: template } })),

    toggleVideoMotion: (id) =>
      set((state) => {
        const current = state.video.motion;
        const axis = VIDEO_MOTION_PRESETS.find((p) => p.id === id)?.axis;
        if (current.includes(id)) {
          return { video: { ...state.video, motion: current.filter((m) => m !== id) } };
        }
        const withoutSameAxis = current.filter(
          (m) => VIDEO_MOTION_PRESETS.find((p) => p.id === m)?.axis !== axis
        );
        return { video: { ...state.video, motion: [...withoutSameAxis, id] } };
      }),

    setVideoMusicStyle: (style) =>
      set((state) => ({ video: { ...state.video, musicStyle: style } })),

    setVideoTrim: (startSec, endSec) =>
      set((state) => ({
        video: { ...state.video, trim: { ...state.video.trim, startSec, endSec } },
      })),

    setVideoMute: (mute) =>
      set((state) => ({
        video: { ...state.video, trim: { ...state.video.trim, mute } },
      })),

    setVideoEnhance: (enhance) =>
      set((state) => ({
        video: { ...state.video, trim: { ...state.video.trim, enhance } },
      })),

    runVideo: async () => {
      const state = get();
      const imageUrl = state.background.url ?? state.sourceImageUrl;
      if (!imageUrl) return;
      set((s) => ({ video: { ...s.video, status: "loading", error: null } }));
      try {
        const response = await fetch("/api/studio-beta/video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl,
            engine: state.video.engine,
            durationSec: state.video.durationSec,
            customPrompt: state.video.customPrompt || null,
            negativePrompt: state.video.negativePrompt || null,
            generateAudio: state.video.generateAudio,
            multiShotTemplate: state.video.multiShotTemplate,
            motion: state.video.motion,
            musicStyle: state.video.musicStyle,
            sourceAspect: state.sourceAspect,
          }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "יצירת הווידאו נכשלה");
        set((s) => ({
          video: {
            ...s.video,
            status: "done",
            url: json.resultUrl,
            modelId: json.modelId,
            costUsd: json.costUsd ?? 0,
            mediaKind: json.mediaKind ?? "video",
            trim: initialVideoTrim(),
          },
          videoSave: initialSaveState(),
          currentStep: 4,
          maxStepReached: Math.max(s.maxStepReached, 4) as 1 | 2 | 3 | 4,
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
        pushAttempt({
          kind: "video",
          url: json.resultUrl,
          label: getVideoEngine(state.video.engine)?.label ?? state.video.engine,
          engine: state.video.engine,
          modelId: json.modelId ?? null,
          costUsd: json.costUsd ?? 0,
          mediaKind: json.mediaKind ?? "video",
        });
        void persistProject();
      } catch (error) {
        set((s) => ({
          video: {
            ...s.video,
            status: "error",
            error: error instanceof Error ? error.message : "שגיאה לא צפויה",
          },
        }));
      }
    },

    enhanceVideoAi: async () => {
      const state = get();
      const videoUrl = state.video.url;
      if (!videoUrl) return;
      set((s) => ({
        video: { ...s.video, aiEnhance: { status: "loading", error: null } },
      }));
      try {
        const response = await fetch("/api/studio-beta/enhance-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl }),
        });
        const json = await response.json();
        if (!json.ok) throw new Error(json.error ?? "שיפור הווידאו נכשל");
        set((s) => ({
          video: {
            ...s.video,
            url: json.resultUrl,
            modelId: json.modelId,
            costUsd: json.costUsd ?? 0,
            mediaKind: "video",
            aiEnhance: { status: "done", error: null },
          },
          videoSave: initialSaveState(),
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
        pushAttempt({
          kind: "video",
          url: json.resultUrl,
          label: "שיפור AI (Veo)",
          engine: "veo-enhance",
          modelId: json.modelId ?? null,
          costUsd: json.costUsd ?? 0,
          mediaKind: "video",
        });
        void persistProject();
      } catch (error) {
        set((s) => ({
          video: {
            ...s.video,
            aiEnhance: {
              status: "error",
              error: error instanceof Error ? error.message : "שגיאה לא צפויה",
            },
          },
        }));
      }
    },

    /**
     * שמירת התמונה והווידאו הן פעולות עצמאיות זו מזו: שמירת אחת אינה
     * "נועלת" את האפשרות להמשיך ליצור/לשמור את השנייה — אין מסך סופי.
     */
    saveImageToLibrary: async (title) => {
      const state = get();
      const url = state.background.url;
      if (!state.sourceImageUrl || !url) return;
      set({ imageSave: { status: "loading", error: null, assetId: null } });
      try {
        const result = await saveStudioBetaAsset({
          mediaType: "image",
          originalUrl: state.sourceImageUrl,
          generatedUrl: url,
          title: title?.trim() || null,
        });
        set({ imageSave: { status: "done", error: null, assetId: result.id } });
        void persistProject();
      } catch (error) {
        set({
          imageSave: {
            status: "error",
            error: error instanceof Error ? error.message : "השמירה נכשלה",
            assetId: null,
          },
        });
      }
    },

    saveVideoToLibrary: async (title) => {
      const state = get();
      const url = state.video.url;
      if (!state.sourceImageUrl || !url) return;
      const isRealVideo = state.video.mediaKind === "video";
      const trim = state.video.trim;
      let finalUrl = url;
      if (isRealVideo) {
        if (trim.enhance) finalUrl = enhanceUploadedVideo(finalUrl);
        if (trim.mute) finalUrl = muteVideo(finalUrl);
        finalUrl = trimVideo(finalUrl, trim.startSec, trim.endSec);
      }
      set({ videoSave: { status: "loading", error: null, assetId: null } });
      try {
        const result = await saveStudioBetaAsset({
          mediaType: isRealVideo ? "video" : "image",
          originalUrl: state.sourceImageUrl,
          generatedUrl: finalUrl,
          title: title?.trim() || null,
        });
        set({ videoSave: { status: "done", error: null, assetId: result.id } });
        void persistProject();
      } catch (error) {
        set({
          videoSave: {
            status: "error",
            error: error instanceof Error ? error.message : "השמירה נכשלה",
            assetId: null,
          },
        });
      }
    },

    startOver: () =>
      set({
        currentStep: 1,
        maxStepReached: 1,
        sourceImageUrl: null,
        sourceKind: "image",
        originalVideoUrl: null,
        originalSourceImageUrl: null,
        resetNotice: null,
        sourceAspect: "original",
        sourceAdjustments: initialSourceAdjustments(),
        sourcePrep: initialSourcePrepState(),
        identify: initialIdentifyState(),
        cutout: initialCutoutState(),
        background: initialBackgroundState(),
        realism: initialRealismState(),
        autoMagic: initialAutoMagicState(),
        outputChoice: null,
        video: initialVideoState(),
        attempts: [],
        imageSave: initialSaveState(),
        videoSave: initialSaveState(),
        currentProjectId: null,
      }),
  };
});

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __studioBetaStore: typeof useStudioBetaStore }).__studioBetaStore =
    useStudioBetaStore;
}
