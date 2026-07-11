import { create } from "zustand";
import type { BackgroundEngineId, VideoEngineId } from "@/lib/studio-beta/engines";
import { BACKGROUND_PRESETS } from "@/lib/studio-beta/backgrounds";
import {
  saveStudioBetaAsset,
  saveStudioBetaProject,
} from "@/app/(ai-studio)/studio-beta/actions";

type StepStatus = "idle" | "loading" | "done" | "error";

type BackgroundState = {
  engine: BackgroundEngineId;
  presetId: string | null;
  customPrompt: string;
  url: string | null;
  modelId: string | null;
  costUsd: number;
  usedCutout: boolean;
  fallbackNote: string | null;
  status: StepStatus;
  error: string | null;
};

type VideoState = {
  engine: VideoEngineId;
  durationSec: number;
  customPrompt: string;
  url: string | null;
  modelId: string | null;
  costUsd: number;
  mediaKind: "video" | "gif" | null;
  status: StepStatus;
  error: string | null;
};

type SaveState = {
  status: StepStatus;
  error: string | null;
  assetId: number | null;
};

type OutputChoice = "image" | "video" | null;

/** תת-קבוצת ה-store הניתנת לשמירה/שחזור כפרויקט (בלי פעולות/פונקציות) */
export type StudioBetaProjectState = {
  currentStep: 1 | 2 | 3 | 4;
  maxStepReached: 1 | 2 | 3 | 4;
  sourceImageUrl: string | null;
  background: BackgroundState;
  outputChoice: OutputChoice;
  video: VideoState;
  imageSave: SaveState;
  videoSave: SaveState;
  sessionCostUsd: number;
};

function initialBackgroundState(): BackgroundState {
  return {
    engine: "gemini-compose",
    presetId: BACKGROUND_PRESETS[0].id,
    customPrompt: "",
    url: null,
    modelId: null,
    costUsd: 0,
    usedCutout: false,
    fallbackNote: null,
    status: "idle",
    error: null,
  };
}

function initialVideoState(): VideoState {
  return {
    engine: "cloudinary-preserve",
    durationSec: 8,
    customPrompt: "",
    url: null,
    modelId: null,
    costUsd: 0,
    mediaKind: null,
    status: "idle",
    error: null,
  };
}

function initialSaveState(): SaveState {
  return { status: "idle", error: null, assetId: null };
}

type StudioBetaState = {
  currentStep: 1 | 2 | 3 | 4;
  sourceImageUrl: string | null;
  resetNotice: string | null;

  background: BackgroundState;
  outputChoice: OutputChoice;
  video: VideoState;

  imageSave: SaveState;
  videoSave: SaveState;

  sessionCostUsd: number;

  /** מזהה הפרויקט השמור המשויך לעבודה הנוכחית, אם נטען/נשמר כבר */
  currentProjectId: number | null;

  /** השלב הרחוק ביותר שכבר הושג — קובע אילו לשוניות בכותרת ניתנות ללחיצה */
  maxStepReached: 1 | 2 | 3 | 4;

  setSourceImage: (url: string) => void;
  dismissResetNotice: () => void;
  hydrateFromProject: (project: {
    id: number;
    state: StudioBetaProjectState;
  }) => void;

  setBackgroundEngine: (engine: BackgroundEngineId) => void;
  setBackgroundPreset: (presetId: string) => void;
  setBackgroundCustomPrompt: (text: string) => void;
  runBackground: () => Promise<void>;
  approveBackground: () => void;
  goToStep: (step: 1 | 2 | 3 | 4) => void;

  chooseOutput: (choice: OutputChoice) => void;
  continueToVideo: () => void;
  setVideoEngine: (engine: VideoEngineId) => void;
  setVideoDuration: (sec: number) => void;
  setVideoCustomPrompt: (text: string) => void;
  runVideo: () => Promise<void>;

  saveImageToLibrary: () => Promise<void>;
  saveVideoToLibrary: () => Promise<void>;
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
        background: state.background,
        outputChoice: state.outputChoice,
        video: state.video,
        imageSave: state.imageSave,
        videoSave: state.videoSave,
        sessionCostUsd: state.sessionCostUsd,
      };
      const result = await saveStudioBetaProject({
        id: state.currentProjectId,
        sourceImageUrl: state.sourceImageUrl,
        thumbnailUrl: state.background.url ?? state.sourceImageUrl,
        state: snapshot,
      });
      set({ currentProjectId: result.id });
    } catch {
      // שמירת פרויקט אינה קריטית לזרימת העבודה — מתעלמים משגיאה
    }
  };

  return {
    currentStep: 1,
    sourceImageUrl: null,
    resetNotice: null,

    background: initialBackgroundState(),
    outputChoice: null,
    video: initialVideoState(),

    imageSave: initialSaveState(),
    videoSave: initialSaveState(),

    sessionCostUsd: 0,
    currentProjectId: null,
    maxStepReached: 1,

    setSourceImage: (url) => {
      set((state) => ({
        sourceImageUrl: url,
        currentStep: 2,
        maxStepReached: 2,
        currentProjectId: null,
        resetNotice:
          state.sourceImageUrl !== null
            ? "התמונה הוחלפה — הרקע והווידאו אופסו"
            : null,
        background: initialBackgroundState(),
        outputChoice: null,
        video: initialVideoState(),
        imageSave: initialSaveState(),
        videoSave: initialSaveState(),
      }));
      void persistProject();
    },

    dismissResetNotice: () => set({ resetNotice: null }),

    hydrateFromProject: (project) => {
      set({
        currentProjectId: project.id,
        resetNotice: null,
        ...project.state,
        maxStepReached: project.state.maxStepReached ?? project.state.currentStep,
      });
    },

    setBackgroundEngine: (engine) =>
      set((state) => ({ background: { ...state.background, engine } })),

    setBackgroundPreset: (presetId) =>
      set((state) => ({ background: { ...state.background, presetId } })),

    setBackgroundCustomPrompt: (text) =>
      set((state) => ({
        background: { ...state.background, customPrompt: text },
      })),

    runBackground: async () => {
      const state = get();
      if (!state.sourceImageUrl) return;
      set((s) => ({ background: { ...s.background, status: "loading", error: null } }));
      try {
        const response = await fetch("/api/studio-beta/background", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceImageUrl: state.sourceImageUrl,
            engine: state.background.engine,
            presetId: state.background.presetId,
            customPrompt: state.background.customPrompt || null,
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
          imageSave: initialSaveState(),
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
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
          },
          videoSave: initialSaveState(),
          currentStep: 4,
          maxStepReached: Math.max(s.maxStepReached, 4) as 1 | 2 | 3 | 4,
          sessionCostUsd: json.cached
            ? s.sessionCostUsd
            : s.sessionCostUsd + (json.costUsd ?? 0),
        }));
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

    /**
     * שמירת התמונה והווידאו הן פעולות עצמאיות זו מזו: שמירת אחת אינה
     * "נועלת" את האפשרות להמשיך ליצור/לשמור את השנייה — אין מסך סופי.
     */
    saveImageToLibrary: async () => {
      const state = get();
      const url = state.background.url;
      if (!state.sourceImageUrl || !url) return;
      set({ imageSave: { status: "loading", error: null, assetId: null } });
      try {
        const result = await saveStudioBetaAsset({
          mediaType: "image",
          originalUrl: state.sourceImageUrl,
          generatedUrl: url,
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

    saveVideoToLibrary: async () => {
      const state = get();
      const url = state.video.url;
      if (!state.sourceImageUrl || !url) return;
      set({ videoSave: { status: "loading", error: null, assetId: null } });
      try {
        const result = await saveStudioBetaAsset({
          mediaType: state.video.mediaKind === "video" ? "video" : "image",
          originalUrl: state.sourceImageUrl,
          generatedUrl: url,
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
        resetNotice: null,
        background: initialBackgroundState(),
        outputChoice: null,
        video: initialVideoState(),
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
