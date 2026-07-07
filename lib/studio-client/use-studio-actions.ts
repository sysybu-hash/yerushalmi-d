"use client";

import * as React from "react";

import {
  studioApiCompositeImage,
  studioApiGenerateVideo,
  studioApiRemoveBackground,
} from "@/lib/studio-api";
import type { StudioActionResult } from "@/lib/studio-action";
import type { StudioAction } from "./reducer";
import type { StudioV2State } from "./state";

/** ניסיון חוזר אוטומטי אחד לשגיאות רשת/זמניות — עם אותו מפתח idempotency */
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type PaidActionName = "cutout" | "preview" | "image" | "video";

export function useStudioActions(
  state: StudioV2State,
  dispatch: React.Dispatch<StudioAction>
) {
  const stateRef = React.useRef(state);
  stateRef.current = state;

  /**
   * מפתח idempotency אחד לכל "כוונה" (פעולה + קלט). לחיצה כפולה,
   * ניסיון חוזר אוטומטי או "נסה שוב" — כולם אותו מפתח, אותו חיוב.
   */
  const intentKeys = React.useRef(new Map<string, string>());

  const keyFor = React.useCallback((intent: string): string => {
    const existing = intentKeys.current.get(intent);
    if (existing) return existing;
    const key = crypto.randomUUID();
    intentKeys.current.set(intent, key);
    return key;
  }, []);

  const finishIntent = React.useCallback((intent: string) => {
    intentKeys.current.delete(intent);
  }, []);

  const refreshUsage = React.useCallback(async () => {
    try {
      const response = await fetch("/api/studio/usage", {
        credentials: "same-origin",
      });
      const body = (await response.json()) as {
        ok?: boolean;
        data?: NonNullable<StudioV2State["usage"]>;
      };
      if (body.ok && body.data) {
        dispatch({ type: "USAGE_LOADED", usage: body.data });
      }
    } catch {
      // מד השימוש אינפורמטיבי בלבד — כשל שקט
    }
  }, [dispatch]);

  const runPaidAction = React.useCallback(
    async <T,>(
      action: PaidActionName,
      intent: string,
      call: (idempotencyKey: string) => Promise<StudioActionResult<T>>,
      onSuccess: (data: T) => void
    ): Promise<boolean> => {
      // נעילה גלובלית — פעולה אחת בכל רגע
      if (stateRef.current.busyAction) return false;

      const idempotencyKey = keyFor(intent);
      dispatch({ type: "ACTION_STARTED", action });

      let result = await call(idempotencyKey);

      // 409 = הפעולה עדיין רצה בשרת — ממתינים ושואלים שוב באותו מפתח
      if (!result.ok && (result.status === 409 || result.retryable)) {
        await sleep(RETRY_DELAY_MS);
        result = await call(idempotencyKey);
      }

      if (result.ok) {
        finishIntent(intent);
        onSuccess(result.data);
        void refreshUsage();
        return true;
      }

      dispatch({
        type: "ACTION_FAILED",
        error: {
          message: result.error,
          retryable: Boolean(result.retryable || result.status === 409),
          action,
        },
      });
      return false;
    },
    [dispatch, keyFor, finishIntent, refreshUsage]
  );

  /**
   * שלב 1 בתשלום (~$0.004, עם מטמון): בידוד התכשיט.
   * force=true — בידוד מחדש עם AI: עוקף מטמון ופרוצדורלי (כשהבידוד יצא גרוע).
   */
  const makeCutout = React.useCallback(
    async (force = false): Promise<string | null> => {
      const { source, cutout, aiEngines, flow } = stateRef.current;
      if (!source.url) return null;
      if (cutout.url && !force) return cutout.url;

      // בידוד מאולץ הוא כוונה חדשה — מפתח חדש בכל לחיצה (הנעילה מגינה מכפילות)
      const intent = force
        ? `cutout-force:${source.url}:${crypto.randomUUID()}`
        : `cutout:${source.url}`;

      let cutoutUrl: string | null = null;
      await runPaidAction(
        "cutout",
        intent,
        (idempotencyKey) =>
          studioApiRemoveBackground(source.url!, {
            engines: aiEngines,
            mode: flow,
            idempotencyKey,
            force,
          }),
        (data) => {
          cutoutUrl = data.url;
          dispatch({
            type: "CUTOUT_DONE",
            url: data.url,
            cached: Boolean(data.cached),
          });
        }
      );
      return cutoutUrl;
    },
    [runPaidAction, dispatch]
  );

  /** תצוגה מקדימה חינמית — קומפוזיט פרוצדורלי (Sharp, ללא AI) */
  const makePreview = React.useCallback(async (): Promise<string | null> => {
    const cutoutUrl = stateRef.current.cutout.url ?? (await makeCutout());
    if (!cutoutUrl) return null;

    const { stylePreset, customPrompt } = stateRef.current;
    let previewUrl: string | null = null;
    await runPaidAction(
      "preview",
      `preview:${cutoutUrl}:${stylePreset}`,
      (idempotencyKey) =>
        studioApiCompositeImage(cutoutUrl, {
          stylePreset,
          customPrompt,
          mode: "catalog",
          useAiBackground: false,
          idempotencyKey,
        }),
      (data) => {
        previewUrl = data.url;
        dispatch({ type: "PREVIEW_DONE", url: data.url, kind: "image" });
      }
    );
    return previewUrl;
  }, [runPaidAction, makeCutout, dispatch]);

  /** תוצאה סופית לתמונה — פרוצדורלי (חינם) או רקע AI (בתשלום, לחיצה מפורשת) */
  const generateImage = React.useCallback(async (): Promise<boolean> => {
    const cutoutUrl = stateRef.current.cutout.url ?? (await makeCutout());
    if (!cutoutUrl) return false;

    const {
      stylePreset,
      customPrompt,
      useAiBackground,
      highQualityBackground,
      aiEngines,
      flow,
      preview,
    } = stateRef.current;

    // בלי רקע AI — התצוגה החינמית היא התוצאה; אין קריאה נוספת
    if (!useAiBackground && preview.url && preview.presetId === stylePreset) {
      dispatch({
        type: "RESULT_DONE",
        url: preview.url,
        kind: "image",
        provider: "procedural",
      });
      return true;
    }

    return runPaidAction(
      "image",
      `image:${cutoutUrl}:${stylePreset}:${useAiBackground ? "ai" : "proc"}:${highQualityBackground ? "hq" : "std"}`,
      (idempotencyKey) =>
        studioApiCompositeImage(cutoutUrl, {
          stylePreset,
          customPrompt,
          mode: flow,
          engines: aiEngines,
          useAiBackground,
          highQualityBackground,
          idempotencyKey,
        }),
      (data) => {
        dispatch({
          type: "RESULT_DONE",
          url: data.url,
          kind: "image",
          provider: useAiBackground ? "ai-background" : "procedural",
        });
      }
    );
  }, [runPaidAction, makeCutout, dispatch]);

  /**
   * וידאו: preserve = zoompan חינמי; ai = Kling/Veo בתשלום.
   * ה-UI אחראי לדיאלוג אישור לפני מצב ai.
   */
  const generateVideo = React.useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    const baseImage =
      current.result.kind === "image" && current.result.url
        ? current.result.url
        : current.preview.url;
    if (!baseImage) return false;

    const {
      videoMotion,
      videoDuration,
      videoPrompt,
      videoNativeAudio,
      videoMultiShot,
      stylePreset,
      aiEngines,
      flow,
    } = current;

    return runPaidAction(
      "video",
      `video:${baseImage}:${videoMotion}:${videoDuration}:${videoMultiShot}:${videoNativeAudio ? "snd" : "mute"}`,
      (idempotencyKey) =>
        studioApiGenerateVideo(baseImage, {
          motionMode: videoMotion,
          duration: videoDuration,
          customPrompt: videoPrompt,
          stylePreset,
          engines: aiEngines,
          studioMode: flow,
          skipImagePipeline: true,
          generateAudio: videoNativeAudio,
          multiShotTemplate: videoMultiShot,
          idempotencyKey,
        }),
      (data) => {
        dispatch({
          type: "RESULT_DONE",
          url: data.url,
          kind: "video",
          provider: data.provider,
        });
      }
    );
  }, [runPaidAction, dispatch]);

  /** "נסה שוב" מהבאנר — מפעיל את הפעולה שנכשלה עם אותו מפתח */
  const retryFailed = React.useCallback(async () => {
    const failed = stateRef.current.error?.action;
    if (!failed) return;
    dispatch({ type: "CLEAR_ERROR" });
    if (failed === "cutout") await makeCutout();
    else if (failed === "preview") await makePreview();
    else if (failed === "image") await generateImage();
    else if (failed === "video") await generateVideo();
  }, [dispatch, makeCutout, makePreview, generateImage, generateVideo]);

  return {
    makeCutout,
    makePreview,
    generateImage,
    generateVideo,
    retryFailed,
    refreshUsage,
  };
}
