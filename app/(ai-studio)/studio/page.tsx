"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, Scissors, Sparkles } from "lucide-react";

import {
  createStudioProject,
  getStudioProject,
  listStudioProjects,
  markStudioProjectPublished,
  saveStudioProject,
  type StudioProjectListItem,
} from "@/app/(ai-studio)/studio/project-actions";
import {
  saveAssetToCloudinary,
  saveToMediaLibrary,
} from "@/app/(ai-studio)/studio/actions";
import {
  INITIAL_STUDIO_STATE,
  deriveStudioStep,
  snapshotToState,
  stateToSnapshot,
} from "@/lib/studio-client/state";
import { studioReducer } from "@/lib/studio-client/reducer";
import { useStudioActions } from "@/lib/studio-client/use-studio-actions";
import { StudioPortfolioPanel } from "@/components/studio/studio-portfolio-panel";
import { StudioAttemptsRail } from "@/components/studio/v2/studio-attempts-rail";
import { StudioImageSidebar } from "@/components/studio/v2/studio-image-sidebar";
import { StudioVideoTools } from "@/components/studio/v2/studio-video-tools";
import { StudioCanvas } from "@/components/studio/v2/studio-canvas";
import { StudioErrorBanner } from "@/components/studio/v2/studio-error-banner";
import { StudioFlowSwitch } from "@/components/studio/v2/studio-flow-switch";
import { StudioPublishBar } from "@/components/studio/v2/studio-publish-bar";
import { StudioUploadZone } from "@/components/studio/v2/studio-upload-zone";
import { StudioUsageMeter } from "@/components/studio/v2/studio-usage-meter";
import { StudioWorkflowSteps, StudioStepSection } from "@/components/studio/v2/studio-workflow-steps";
import { StudioVideoOptions } from "@/components/studio/v2/studio-video-options";
import { cutoutMethodLabel } from "@/lib/studio-engine-ui";
import { Button } from "@/components/ui/button";

function StudioV2Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, dispatch] = React.useReducer(
    studioReducer,
    INITIAL_STUDIO_STATE
  );
  const actions = useStudioActions(state, dispatch);

  const [projects, setProjects] = React.useState<StudioProjectListItem[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [activeProjectId, setActiveProjectId] = React.useState<number | null>(
    null
  );
  const hydrated = React.useRef(false);
  const skipNextSave = React.useRef(false);

  const showToast = React.useCallback(
    (message: string) => {
      dispatch({ type: "TOAST", message });
      window.setTimeout(() => dispatch({ type: "TOAST", message: null }), 4000);
    },
    [dispatch]
  );

  const refreshProjects = React.useCallback(async () => {
    const list = await listStudioProjects();
    setProjects(list);
  }, []);

  const setProjectInUrl = React.useCallback(
    (id: number | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("project", String(id));
      else params.delete("project");
      const qs = params.toString();
      router.replace(qs ? `/studio?${qs}` : "/studio", {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  // טעינה ראשונית — רשימת עבודות + עבודה מה-URL + מד שימוש
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listStudioProjects();
        if (cancelled) return;
        setProjects(list);

        const param = searchParams.get("project");
        const id = param ? Number(param) : NaN;
        if (Number.isFinite(id) && id > 0) {
          const row = await getStudioProject(id);
          if (!cancelled) {
            skipNextSave.current = true;
            dispatch({ type: "RESTORE", state: snapshotToState(row.snapshot) });
            setActiveProjectId(row.id);
          }
        }
      } catch {
        if (!cancelled) showToast("לא ניתן לטעון את תיק העבודות");
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
          hydrated.current = true;
        }
      }
    })();
    void actions.refreshUsage();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // שמירה אוטומטית (debounced) — לא בזמן פעולה רצה
  React.useEffect(() => {
    if (!hydrated.current || state.busyAction) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (!state.source.url) return;

    const timer = window.setTimeout(async () => {
      try {
        const snapshot = stateToSnapshot(state);
        let id = activeProjectId;
        if (!id) {
          id = (await createStudioProject(snapshot)).id;
          setActiveProjectId(id);
          setProjectInUrl(id);
        }
        await saveStudioProject(id, snapshot);
        await refreshProjects();
      } catch {
        // שמירה שקטה — לא מפריעים לעבודה
      }
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [state, activeProjectId, refreshProjects, setProjectInUrl]);

  const openProject = React.useCallback(
    async (id: number) => {
      try {
        const row = await getStudioProject(id);
        skipNextSave.current = true;
        dispatch({ type: "RESTORE", state: snapshotToState(row.snapshot) });
        setActiveProjectId(id);
        setProjectInUrl(id);
      } catch (e) {
        showToast(e instanceof Error ? e.message : "פתיחת העבודה נכשלה");
      }
    },
    [setProjectInUrl, showToast]
  );

  const startNewProject = React.useCallback(() => {
    skipNextSave.current = true;
    dispatch({ type: "RESET" });
    setActiveProjectId(null);
    setProjectInUrl(null);
  }, [setProjectInUrl]);

  // שמירה אוטומטית של כל תוצאה מוכנה לספריית התוכן — פעם אחת לכל URL
  const savedResults = React.useRef(new Set<string>());
  React.useEffect(() => {
    const { url, kind, status } = state.result;
    const sourceUrl = state.source.url;
    if (status !== "done" || !url || !kind || !sourceUrl) return;
    if (savedResults.current.has(url)) return;
    savedResults.current.add(url);

    (async () => {
      try {
        const { url: storedUrl } = await saveAssetToCloudinary(url, kind);
        await saveToMediaLibrary(kind, sourceUrl, storedUrl);
        showToast("התוצאה נשמרה אוטומטית בספריית התוכן");
      } catch {
        savedResults.current.delete(url);
        showToast("השמירה האוטומטית לספרייה נכשלה — השתמשו בכפתור השמירה");
      }
    })();
  }, [state.result, state.source.url, showToast]);

  const handleAction = React.useCallback(
    (id: "preview" | "image" | "video") => {
      if (id === "video") void actions.generateVideo();
      else void actions.generateStudioImage();
    },
    [actions]
  );

  const busy = state.busyAction !== null;

  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      {/* שורה עליונה */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-light">
          <Sparkles className="h-5 w-5 text-gold-dark" />
          סטודיו יצירת תוכן AI
        </h1>
        <div className="flex items-center gap-2">
          <StudioUsageMeter usage={state.usage} />
          <Button
            variant="outline"
            size="sm"
            onClick={startNewProject}
            disabled={busy}
            className="rounded-none text-xs font-light"
          >
            <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
            עבודה חדשה
          </Button>
        </div>
      </div>

      <StudioErrorBanner
        error={state.error}
        busy={busy}
        onRetry={() => void actions.retryFailed()}
        onDismiss={() => dispatch({ type: "CLEAR_ERROR" })}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]">
        {/* קנבס מרכזי */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <StudioCanvas state={state} />
          <StudioAttemptsRail
            attempts={state.attempts}
            selectedId={state.selectedAttemptId}
            currentUrl={state.result.url ?? state.preview.url}
            onSelect={(id) => dispatch({ type: "SELECT_ATTEMPT", id })}
            onUseAsResult={(id) => {
              dispatch({ type: "USE_ATTEMPT_AS_RESULT", id });
              showToast("הניסיון נבחר כתוצאה — אפשר לפרסם או להמשיך לעבוד");
            }}
            onDelete={(id) => dispatch({ type: "DELETE_ATTEMPT", id })}
            disabled={busy}
          />
          {state.source.url && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StudioUploadZone
                  hasSource
                  onUploaded={(url, kind, duration) =>
                    dispatch({ type: "SOURCE_UPLOADED", url, kind, duration })
                  }
                  disabled={busy}
                />
                {state.cutout.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void actions.makeCutout(true)}
                    title="הבידוד יצא גרוע? הרצה מחדש עם AI — עוקף את המטמון"
                    className="rounded-none text-xs font-light"
                  >
                    <Scissors className="ml-1.5 h-3.5 w-3.5" />
                    בידוד מחדש עם AI
                  </Button>
                )}
              </div>
              {state.cutout.url && (
                <span className="text-[10px] font-light text-muted-foreground">
                  {cutoutMethodLabel(state.cutout.url) ?? "בידוד AI"}
                  {state.cutout.cached ? " · מהמטמון" : ""}
                </span>
              )}
            </div>
          )}
        </div>

        {/* פאנל צד קונטקסטואלי */}
        <div className="space-y-4">
          <StudioFlowSwitch
            flow={state.flow}
            onChange={(flow) => dispatch({ type: "SET_FLOW", flow })}
            disabled={busy}
          />

          {state.source.url && state.source.kind === "image" && (
            <StudioWorkflowSteps state={state} />
          )}

          {!state.source.url ? (
            <StudioUploadZone
              hasSource={false}
              onUploaded={(url, kind, duration) =>
                dispatch({ type: "SOURCE_UPLOADED", url, kind, duration })
              }
              disabled={busy}
            />
          ) : state.source.kind === "video" ? (
            <>
              <StudioWorkflowSteps state={state} />

              <StudioStepSection
                step={2}
                currentStep={deriveStudioStep(state)}
                title="מיטוב וידאו (אופציונלי)"
              >
                <Button
                  disabled={busy}
                  onClick={() => void actions.enhanceSourceVideo()}
                  className="w-full rounded-none bg-gold text-sm font-light text-black hover:bg-gold/90"
                >
                  מיטוב הווידאו המקורי (חינם) — חדות, צבע ותנועה
                </Button>
              </StudioStepSection>

              {!(state.result.url && state.result.kind === "video") && (
                <StudioStepSection
                  step={3}
                  currentStep={deriveStudioStep(state)}
                  title="יצירת וידאו"
                >
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
                  <Button
                    disabled={busy}
                    onClick={() => handleAction("video")}
                    className="w-full rounded-none bg-gold text-sm font-light text-black hover:bg-gold/90"
                  >
                    {state.videoMotion === "preserve"
                      ? "יצירת וידאו זום עדין מפריים ראשון (חינם)"
                      : "יצירת וידאו AI קולנועי מהסרטון"}
                  </Button>
                  <p className="text-[11px] font-light text-muted-foreground">
                    מבוסס על הפריים הראשון בסרטון שהעליתם.
                  </p>
                </StudioStepSection>
              )}

              <StudioVideoTools
                videoUrl={
                  state.result.kind === "video" && state.result.url
                    ? state.result.url
                    : state.source.url
                }
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
                onRequestEnhanceAi={() => void actions.enhanceVideoAi()}
                disabled={busy}
              />

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
                onContinueEditing={() =>
                  dispatch({ type: "CONTINUE_FROM_RESULT" })
                }
                showToast={showToast}
                onPublished={(productId) => {
                  if (activeProjectId) {
                    void markStudioProjectPublished(activeProjectId, {
                      kind: "catalog",
                      productId,
                    }).then(refreshProjects);
                  }
                }}
              />
            </>
          ) : (
            <StudioImageSidebar
              state={state}
              dispatch={dispatch}
              actions={actions}
              busy={busy}
              onAction={handleAction}
              showToast={showToast}
              onPublished={(productId) => {
                if (activeProjectId) {
                  void markStudioProjectPublished(activeProjectId, {
                    kind: "catalog",
                    productId,
                  }).then(refreshProjects);
                }
              }}
              onRequestEnhanceAi={() => void actions.enhanceVideoAi()}
            />
          )}

        </div>
      </div>

      {/* תיק עבודות */}
      <StudioPortfolioPanel
        projects={projects}
        activeProjectId={activeProjectId}
        loading={loadingProjects}
        onRefresh={refreshProjects}
        onSelect={(id) => void openProject(id)}
        onNewProject={startNewProject}
        showToast={showToast}
      />

      {/* טוסט */}
      {state.toast && (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 border border-gold/40 bg-background px-4 py-2 text-sm font-light shadow-lg">
          {state.toast}
        </div>
      )}
    </div>
  );
}

export default function StudioV2Page() {
  return (
    <Suspense fallback={null}>
      <StudioV2Content />
    </Suspense>
  );
}
