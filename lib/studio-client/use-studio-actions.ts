"use client";

import * as React from "react";

import {
  studioApiCompositeImage,
  studioApiEnhanceSource,
  studioApiEnhanceVideo,
  studioApiGenerateVideo,
  studioApiRemoveBackground,
  type SourceEnhancePreset,
} from "@/lib/studio-api";
import type { StudioActionResult } from "@/lib/studio-action";
import { STUDIO_STYLE_PRESETS } from "@/lib/studio-presets";
import { opaqueImageUrlForVideo, videoFrameJpgUrl } from "@/lib/cloudinary-url";
import type { StudioAction } from "./reducer";
import type { StudioV2State } from "./state";

function presetLabel(presetId: string): string {
  return (
    STUDIO_STYLE_PRESETS.find((p) => p.id === presetId)?.label ?? presetId
  );
}

/** ניסיון חוזר אוטומטי אחד לשגיאות רשת/זמניות — עם אותו מפתח idempotency */
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type PaidActionName = "cutout" | "preview" | "image" | "video" | "enhance";

type RunPaidActionOptions = {
  enhanceKind?: "source" | "video";
};

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

  const lastEnhanceSourcePreset = React.useRef<SourceEnhancePreset | null>(null);

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
      onSuccess: (data: T) => void,
      options: RunPaidActionOptions = {}
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
          enhanceKind: options.enhanceKind,
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

  /** יצירת תמונת קטלוג — בידוד + הרכבה; בלי רקע AI גם מעלה לתוצאה סופית */
  const makePreview = React.useCallback(async (): Promise<string | null> => {
    const cutoutUrl = stateRef.current.cutout.url ?? (await makeCutout());
    if (!cutoutUrl) return null;

    const { stylePreset, customPrompt, flow, useAiBackground } =
      stateRef.current;
    const label = presetLabel(stylePreset);
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
        if (flow === "catalog" && !useAiBackground) {
          dispatch({
            type: "PREVIEW_AND_RESULT_DONE",
            url: data.url,
            kind: "image",
            provider: "procedural",
            label,
            free: true,
          });
        } else {
          dispatch({
            type: "PREVIEW_DONE",
            url: data.url,
            kind: "image",
            label,
            free: true,
          });
        }
      }
    );
    return previewUrl;
  }, [runPaidAction, makeCutout, dispatch]);

  /** תוצאה סופית לתמונה — רקע AI בלבד (פרוצדורלי עולה אוטומטית ב-makePreview) */
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
    } = stateRef.current;

    if (!useAiBackground) return false;

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
          label: useAiBackground
            ? `${presetLabel(stylePreset)} · רקע AI`
            : presetLabel(stylePreset),
          free: !useAiBackground,
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
    // סדר עדיפות: תוצאת תמונה קיימת > תצוגה מקדימה > המקור כמו-שהוא
    // (בלי בידוד) — כך אפשר ליצור וידאו מכל תמונה, גם ללא הסרת רקע.
    // אם המקור הוא וידאו שהועלה (לא תמונה) — מחלצים פריים ראשון ממנו
    // ומשתמשים בו כבסיס ליצירת וידאו AI מסוגנן (Kling/Veo דורשים תמונה).
    const baseImage =
      (current.result.kind === "image" && current.result.url) ||
      current.preview.url ||
      (current.source.kind === "image"
        ? current.source.url
        : current.source.kind === "video" && current.source.url
          ? opaqueImageUrlForVideo(videoFrameJpgUrl(current.source.url, 0))
          : null);
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
          label:
            data.provider === "preserve"
              ? "וידאו זום עדין"
              : `וידאו ${data.provider === "kling" ? "Kling" : "Veo"}`,
          free: data.provider === "preserve",
        });
      }
    );
  }, [runPaidAction, dispatch]);

  /** עוד 2 סגנונות מאותו בידוד — הרכבות פרוצדורליות, חינם */
  const makeVariants = React.useCallback(async (): Promise<void> => {
    const { cutout, stylePreset, customPrompt, attempts } = stateRef.current;
    if (!cutout.url) return;

    const used = new Set(
      [stylePreset, ...attempts.map((a) => a.label)].map(String)
    );
    const candidates = STUDIO_STYLE_PRESETS.filter(
      (p) => p.id !== stylePreset && !used.has(p.label)
    ).slice(0, 2);

    for (const preset of candidates) {
      const ok = await runPaidAction(
        "preview",
        `preview:${cutout.url}:${preset.id}`,
        (idempotencyKey) =>
          studioApiCompositeImage(cutout.url!, {
            stylePreset: preset.id,
            customPrompt,
            mode: "catalog",
            useAiBackground: false,
            idempotencyKey,
          }),
        (data) => {
          dispatch({
            type: "ATTEMPT_ADDED",
            url: data.url,
            kind: "image",
            label: preset.label,
            free: true,
          });
        }
      );
      if (!ok) break;
    }
  }, [runPaidAction, dispatch]);

  /** שיפור צילום המקור ב-AI (Gemini) — מחליף את המקור */
  const enhanceSource = React.useCallback(
    async (preset: SourceEnhancePreset): Promise<boolean> => {
      const { source, customPrompt, flow } = stateRef.current;
      if (!source.url || source.kind !== "image") return false;

      lastEnhanceSourcePreset.current = preset;

      return runPaidAction(
        "enhance",
        `enhance-source:${source.url}:${preset}`,
        (idempotencyKey) =>
          studioApiEnhanceSource(source.url!, {
            preset,
            customPrompt,
            mode: flow,
            idempotencyKey,
          }),
        (data) => {
          dispatch({
            type: "ATTEMPT_ADDED",
            url: data.url,
            kind: "image",
            label: "מקור משופר AI",
            free: false,
          });
          dispatch({ type: "SOURCE_UPLOADED", url: data.url, kind: "image", keepOriginal: true });
        },
        { enhanceKind: "source" }
      );
    },
    [runPaidAction, dispatch]
  );

  /** מיטוב וידאו שהועלה — שומר את התנועה המקורית (חינם, Cloudinary) */
  const enhanceSourceVideo = React.useCallback(async (): Promise<boolean> => {
    const { source, videoDuration } = stateRef.current;
    if (!source.url || source.kind !== "video") return false;

    return runPaidAction(
      "video",
      `source-video:${source.url}:${videoDuration}`,
      (idempotencyKey) =>
        studioApiGenerateVideo(source.url!, {
          motionMode: "preserve",
          useSourceVideoMotion: true,
          sourceVideoUrl: source.url!,
          duration: videoDuration,
          skipImagePipeline: true,
          idempotencyKey,
        }),
      (data) => {
        dispatch({
          type: "RESULT_DONE",
          url: data.url,
          kind: "video",
          provider: data.provider,
          label: "וידאו מקורי ממוטב",
          free: true,
        });
      }
    );
  }, [runPaidAction, dispatch]);

  /** מיטוב וידאו ב-AI (Veo) — משפר תאורה ותנועה, בתשלום */
  const enhanceVideoAi = React.useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    const videoUrl =
      current.result.kind === "video" && current.result.url
        ? current.result.url
        : current.source.kind === "video"
          ? current.source.url
          : null;
    if (!videoUrl) return false;

    return runPaidAction(
      "enhance",
      `enhance-video:${videoUrl}`,
      (idempotencyKey) =>
        studioApiEnhanceVideo(videoUrl, {
          preset: "catalog",
          provider: "gemini",
          duration: current.videoDuration,
          stylePreset: current.stylePreset,
          mode: current.flow,
          idempotencyKey,
        }),
      (data) => {
        dispatch({
          type: "RESULT_DONE",
          url: data.url,
          kind: "video",
          provider: "veo",
          label: "וידאו משופר AI",
          free: false,
        });
      },
      { enhanceKind: "video" }
    );
  }, [runPaidAction, dispatch]);

  /** "נסה שוב" מהבאנר — מפעיל את הפעולה שנכשלה עם אותו מפתח */
  const retryFailed = React.useCallback(async () => {
    const error = stateRef.current.error;
    if (!error) return;
    dispatch({ type: "CLEAR_ERROR" });
    const failed = error.action;
    if (failed === "cutout") await makeCutout();
    else if (failed === "preview") await makePreview();
    else if (failed === "image") await generateImage();
    else if (failed === "video") await generateVideo();
    else if (failed === "enhance") {
      if (error.enhanceKind === "source" && lastEnhanceSourcePreset.current) {
        await enhanceSource(lastEnhanceSourcePreset.current);
      } else {
        await enhanceVideoAi();
      }
    }
  }, [dispatch, makeCutout, makePreview, generateImage, generateVideo, enhanceVideoAi, enhanceSource]);

  return {
    makeCutout,
    makePreview,
    generateImage,
    generateVideo,
    makeVariants,
    enhanceSource,
    enhanceSourceVideo,
    enhanceVideoAi,
    retryFailed,
    refreshUsage,
  };
}
