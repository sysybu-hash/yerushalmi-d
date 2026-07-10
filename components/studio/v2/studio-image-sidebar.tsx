"use client";

import * as React from "react";
import { Shuffle } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import {
  deriveStudioStep,
  resolveActiveImageLabel,
  resolveActiveImageUrl,
} from "@/lib/studio-client/state";
import type { useStudioActions } from "@/lib/studio-client/use-studio-actions";
import type { SourceEnhancePreset } from "@/lib/studio-api";
import { Button } from "@/components/ui/button";
import { StudioActionPanel } from "./studio-action-panel";
import { StudioBackgroundEngineChoice } from "./studio-background-engine-choice";
import { StudioEnginesSection } from "./studio-engines-section";
import { StudioPromptsSection } from "./studio-prompts-section";
import { StudioPublishBar } from "./studio-publish-bar";
import { StudioSourceSection } from "./studio-source-section";
import { StudioStepSection } from "./studio-workflow-steps";
import { StudioStyleRail } from "./studio-style-rail";
import { StudioVideoOptions } from "./studio-video-options";
import { StudioVideoTools } from "./studio-video-tools";

type StudioActions = ReturnType<typeof useStudioActions>;

export function StudioImageSidebar({
  state,
  dispatch,
  actions,
  busy,
  onAction,
  showToast,
  onPublished,
  onRequestEnhanceAi,
}: {
  state: StudioV2State;
  dispatch: React.Dispatch<import("@/lib/studio-client/reducer").StudioAction>;
  actions: StudioActions;
  busy: boolean;
  onAction: (id: "preview" | "image" | "video") => void;
  showToast: (message: string) => void;
  onPublished: (productId: number) => void;
  onRequestEnhanceAi: () => void;
}) {
  const step = deriveStudioStep(state);
  const hasFinalResult = Boolean(state.result.url);
  const hasFinalImage = Boolean(
    state.result.url && state.result.kind === "image"
  );
  // בשיווק, תוצאת תמונה היא רק בסיס לוידאו — עדיין לא סוף התהליך, ולכן
  // ממשיכים להציג את פאנל ההגדרות (עם כפתור "יצירת וידאו") ולא את שורת הפרסום.
  const awaitingVideoAfterImage =
    state.flow === "marketing" && hasFinalImage;
  const configuring = Boolean(
    state.source.url && (!hasFinalResult || awaitingVideoAfterImage)
  );

  return (
    <>
      {configuring && (
        <>
          <StudioStepSection
            step={2}
            currentStep={step}
            title="בחירת רקע ומיטוב (אופציונלי)"
          >
            <StudioStyleRail
              value={state.stylePreset}
              onChange={(presetId) => {
                const hadPreview = Boolean(state.preview.url);
                dispatch({ type: "SET_PRESET", presetId });
                if (hadPreview) {
                  showToast(
                    "סגנון חדש — לחצו יצירה מחדש. התוצאה הקודמת עדיין זמינה לפרסום"
                  );
                }
              }}
              disabled={busy}
            />

            <StudioBackgroundEngineChoice
              useAiBackground={state.useAiBackground}
              backgroundProvider={state.aiEngines.background}
              highQualityBackground={state.highQualityBackground}
              onUseAiBackgroundChange={(value) =>
                dispatch({ type: "SET_USE_AI_BACKGROUND", value })
              }
              onBackgroundProviderChange={(value) =>
                dispatch({
                  type: "SET_ENGINES",
                  engines: { ...state.aiEngines, background: value },
                })
              }
              onHighQualityBackgroundChange={(value) =>
                dispatch({ type: "SET_HIGH_QUALITY_BACKGROUND", value })
              }
              disabled={busy}
            />

            <StudioSourceSection
              sourceUrl={
                resolveActiveImageUrl(state) ?? state.source.url ?? ""
              }
              activeImageLabel={resolveActiveImageLabel(state)}
              adjustments={state.sourceAdj}
              onAdjustmentsChange={(value) =>
                dispatch({ type: "SET_SOURCE_ADJ", value })
              }
              onSourceReplaced={(url, label) => {
                dispatch({
                  type: "ATTEMPT_ADDED",
                  url,
                  kind: "image",
                  label,
                  free: true,
                });
                dispatch({
                  type: "SOURCE_UPLOADED",
                  url,
                  kind: "image",
                  keepOriginal: true,
                });
                void actions.makeCutout(true).then((cutoutUrl) => {
                  if (cutoutUrl) {
                    showToast(
                      "המקור עודכן — הבידוד הושלם, לחצו יצירת תמונה"
                    );
                  }
                });
              }}
              onAiEnhance={(preset: SourceEnhancePreset) =>
                void actions.enhanceSource(preset).then((ok) => {
                  if (ok) {
                    showToast(
                      "שיפור AI הושלם — הבידוד עודכן, לחצו יצירת תמונה"
                    );
                  }
                })
              }
              disabled={busy}
            />

            {state.flow === "marketing" && (
              <StudioVideoOptions
                duration={state.videoDuration}
                motion={state.videoMotion}
                videoEngine={state.aiEngines.video}
                nativeAudio={state.videoNativeAudio}
                multiShot={state.videoMultiShot}
                onDurationChange={(value) =>
                  dispatch({ type: "SET_VIDEO_DURATION", value })
                }
                onMotionChange={(value) =>
                  dispatch({ type: "SET_VIDEO_MOTION", value })
                }
                onNativeAudioChange={(value) =>
                  dispatch({ type: "SET_VIDEO_NATIVE_AUDIO", value })
                }
                onMultiShotChange={(value) =>
                  dispatch({ type: "SET_VIDEO_MULTISHOT", value })
                }
                disabled={busy}
              />
            )}
          </StudioStepSection>

          <StudioStepSection
            step={3}
            currentStep={step}
            title={
              state.flow === "marketing"
                ? "בידוד, עיצוב והנחיות — ואז וידאו"
                : "בידוד, עיצוב והנחיות"
            }
          >
            <StudioPromptsSection
              flow={state.flow}
              customPrompt={state.customPrompt}
              videoPrompt={state.videoPrompt}
              onCustomPromptChange={(value) =>
                dispatch({ type: "SET_CUSTOM_PROMPT", value })
              }
              onVideoPromptChange={(value) =>
                dispatch({ type: "SET_VIDEO_PROMPT", value })
              }
              disabled={busy}
            />

            <StudioEnginesSection
              flow={state.flow}
              engines={state.aiEngines}
              onChange={(engines) =>
                dispatch({ type: "SET_ENGINES", engines })
              }
              disabled={busy}
            />

            <StudioActionPanel state={state} onAction={onAction} />
          </StudioStepSection>
        </>
      )}

      {hasFinalResult && !awaitingVideoAfterImage && (
        <>
          <StudioPublishBar
            state={state}
            onTitleChange={(value) =>
              dispatch({ type: "SET_PRODUCT_TITLE", value })
            }
            onPriceChange={(value) =>
              dispatch({ type: "SET_PRODUCT_PRICE", value })
            }
            onAspectChange={(value) =>
              dispatch({ type: "SET_RESULT_ASPECT", value })
            }
            onContinueEditing={() => {
              dispatch({ type: "CONTINUE_FROM_RESULT" });
              showToast("התוצאה הפכה למקור — אפשר לעצב סיבוב נוסף");
            }}
            showToast={showToast}
            onPublished={onPublished}
          />

          {state.cutout.url && hasFinalImage && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void actions.makeVariants()}
              className="w-full rounded-none border-gold/40 text-xs font-light text-gold-dark hover:bg-gold/10"
            >
              <Shuffle className="ml-1.5 h-3.5 w-3.5" />
              עוד 2 סגנונות מאותו בידוד — חינם
            </Button>
          )}

          {state.result.kind === "video" && state.result.url && (
            <StudioVideoTools
              videoUrl={state.result.url}
              adjustments={state.videoAdj}
              onAdjustmentsChange={(value) =>
                dispatch({ type: "SET_VIDEO_ADJ", value })
              }
              onApplied={(url, label) => {
                dispatch({
                  type: "RESULT_DONE",
                  url,
                  kind: "video",
                  label,
                  free: true,
                });
                showToast("הגרסה הערוכה נשמרה בגלריה");
              }}
              onRequestEnhanceAi={onRequestEnhanceAi}
              disabled={busy}
            />
          )}
        </>
      )}
    </>
  );
}
