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
  snapshotToState,
  stateToSnapshot,
} from "@/lib/studio-client/state";
import { studioReducer } from "@/lib/studio-client/reducer";
import { useStudioActions } from "@/lib/studio-client/use-studio-actions";
import { StudioPortfolioPanel } from "@/components/studio/studio-portfolio-panel";
import { StudioActionPanel } from "@/components/studio/v2/studio-action-panel";
import { StudioAdvancedAccordion } from "@/components/studio/v2/studio-advanced-accordion";
import { StudioCanvas } from "@/components/studio/v2/studio-canvas";
import { StudioConfirmDialog } from "@/components/studio/v2/studio-confirm-dialog";
import { StudioErrorBanner } from "@/components/studio/v2/studio-error-banner";
import { StudioFlowSwitch } from "@/components/studio/v2/studio-flow-switch";
import { StudioPublishBar } from "@/components/studio/v2/studio-publish-bar";
import { StudioStyleRail } from "@/components/studio/v2/studio-style-rail";
import { StudioUploadZone } from "@/components/studio/v2/studio-upload-zone";
import { StudioUsageMeter } from "@/components/studio/v2/studio-usage-meter";
import { StudioVideoOptions } from "@/components/studio/v2/studio-video-options";
import { STUDIO_COST_LABELS } from "@/components/studio/v2/studio-cost-chip";
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
  const [confirmVideo, setConfirmVideo] = React.useState(false);
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
      if (id === "preview") void actions.makePreview();
      else if (id === "image") void actions.generateImage();
      else if (id === "video") {
        // וידאו AI — הפעולה היקרה ביותר, דורשת אישור מפורש
        if (state.videoMotion === "ai") setConfirmVideo(true);
        else void actions.generateVideo();
      }
    },
    [actions, state.videoMotion]
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
          {state.source.url && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StudioUploadZone
                  hasSource
                  onUploaded={(url) =>
                    dispatch({ type: "SOURCE_UPLOADED", url, kind: "image" })
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
              {state.cutout.cached && state.cutout.url && (
                <span className="text-[10px] font-light text-emerald-700">
                  ✓ בידוד מהמטמון — ללא חיוב
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

          {!state.source.url ? (
            <StudioUploadZone
              hasSource={false}
              onUploaded={(url) =>
                dispatch({ type: "SOURCE_UPLOADED", url, kind: "image" })
              }
              disabled={busy}
            />
          ) : (
            <>
              <StudioStyleRail
                value={state.stylePreset}
                onChange={(presetId) =>
                  dispatch({ type: "SET_PRESET", presetId })
                }
                disabled={busy}
              />

              {state.flow === "marketing" && (
                <StudioVideoOptions
                  duration={state.videoDuration}
                  motion={state.videoMotion}
                  onDurationChange={(value) =>
                    dispatch({ type: "SET_VIDEO_DURATION", value })
                  }
                  onMotionChange={(value) =>
                    dispatch({ type: "SET_VIDEO_MOTION", value })
                  }
                  disabled={busy}
                />
              )}

              <StudioActionPanel state={state} onAction={handleAction} />

              <StudioPublishBar
                state={state}
                onTitleChange={(value) =>
                  dispatch({ type: "SET_PRODUCT_TITLE", value })
                }
                onPriceChange={(value) =>
                  dispatch({ type: "SET_PRODUCT_PRICE", value })
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

              <StudioAdvancedAccordion
                state={state}
                dispatch={dispatch}
                disabled={busy}
              />
            </>
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

      <StudioConfirmDialog
        open={confirmVideo}
        title="יצירת וידאו AI"
        description={`וידאו ${state.videoDuration} שניות בתנועת AI קולנועית. זו הפעולה היקרה ביותר בסטודיו — ודאו שהתצוגה המקדימה מוצאת חן בעיניכם קודם.`}
        costLabel={STUDIO_COST_LABELS.aiVideo}
        previewUrl={state.result.url ?? state.preview.url}
        confirmLabel="אישור ויצירה"
        onConfirm={() => {
          setConfirmVideo(false);
          void actions.generateVideo();
        }}
        onCancel={() => setConfirmVideo(false)}
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
