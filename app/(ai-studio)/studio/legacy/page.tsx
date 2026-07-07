"use client";

import * as React from "react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  CheckCircle2,
  Clapperboard,
  Copy,
  Download,
  FolderHeart,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  saveAssetToCloudinary,
  saveToMediaLibrary,
  publishProductToCatalog,
} from "@/app/(ai-studio)/studio/actions";
import {
  humanizeStudioError,
  studioApiCompositeImage,
  studioApiGenerateVideo,
  studioApiRemoveBackground,
} from "@/lib/studio-api";
import type { GenerateImageOptions, GenerateVideoOptions, StudioVideoMotionMode } from "@/lib/studio-types";
import { StudioMediaEditor } from "@/components/studio/media-editor";
import { StudioSourcePrep } from "@/components/studio/studio-source-prep";
import { StudioVideoPrep } from "@/components/studio/studio-video-prep";
import { StudioVideoAudioPanel } from "@/components/studio/studio-video-audio-panel";
import { StudioCreativeOptionsPanel } from "@/components/studio/studio-creative-options";
import { StudioPortfolioPanel } from "@/components/studio/studio-portfolio-panel";
import { StudioTipsPanel } from "@/components/studio/studio-tips-panel";
import {
  emptyStudioForm,
  useStudioProjectPersistence,
  type StudioFormState,
} from "@/components/studio/use-studio-project-persistence";
import {
  EMPTY_EDIT_SNAPSHOT,
  type StudioClientState,
  type StudioEditSnapshot,
} from "@/lib/studio-project-snapshot";
import {
  DEFAULT_AI_ENGINES,
  type AiEngineConfig,
  type StudioPipelineMode,
} from "@/lib/ai-engines";
import {
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_VIDEO_ADJUSTMENTS,
  JEWELRY_CATALOG_VIDEO_PREVIEW_ADJUSTMENTS,
  studioVideoPreviewUrl,
  type ImageAdjustments,
  type VideoAdjustments,
} from "@/lib/studio-transform";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import { cutoutDisplayUrl } from "@/lib/cloudinary-url";
import {
  StudioWorkflowStepper,
  type StudioWorkflowStep,
} from "@/components/studio/studio-workflow-stepper";
import { Button } from "@/components/ui/button";
import { MediaPreviewTrigger } from "@/components/ui/media-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  STUDIO_PIPELINE_STEPS,
  STUDIO_STYLE_PRESETS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";

const LOADING_MESSAGES: Record<"image" | "video", string> = {
  image: "שומר על התכשיט המקורי — מחליף רק את הרקע והתאורה",
  video: "יוצר קליפ וידאו קולנועי — עד 10 שניות",
};

function StudioPageContent() {
  const [state, setState] = React.useState<StudioClientState>({ status: "empty" });
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [stylePreset, setStylePreset] =
    React.useState<StudioStylePresetId>("luxury-marble");
  const [videoPrompt, setVideoPrompt] = React.useState("");
  const [videoDuration, setVideoDuration] =
    React.useState<StudioVideoDurationSec>(5);
  const [videoMode, setVideoMode] = React.useState<"standard" | "pro">("pro");
  const [videoMotionMode, setVideoMotionMode] =
    React.useState<StudioVideoMotionMode>("preserve");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [workflowStep, setWorkflowStep] =
    React.useState<StudioWorkflowStep>(1);
  const [edit, setEdit] = React.useState<StudioEditSnapshot>(EMPTY_EDIT_SNAPSHOT);
  const [aiEngines, setAiEngines] =
    React.useState<AiEngineConfig>(DEFAULT_AI_ENGINES);
  const [studioMode, setStudioMode] =
    React.useState<StudioPipelineMode>("catalog");
  const [useAiBackground, setUseAiBackground] = React.useState(false);
  const [highQualityBackground, setHighQualityBackground] =
    React.useState(false);
  const [cutoutUrl, setCutoutUrl] = React.useState("");
  const [lastCompositeUrl, setLastCompositeUrl] = React.useState("");
  const [productTitle, setProductTitle] = React.useState("");
  const [productPrice, setProductPrice] = React.useState("");
  const [productCategory] = React.useState("rings");
  const [sourcePrepAdj, setSourcePrepAdj] =
    React.useState<ImageAdjustments>(DEFAULT_IMAGE_ADJUSTMENTS);
  const [videoPostAdj, setVideoPostAdj] =
    React.useState<VideoAdjustments>(DEFAULT_VIDEO_ADJUSTMENTS);

  const applyForm = React.useCallback((next: StudioFormState) => {
    setState(next.state);
    setMode(next.mode);
    setWorkflowStep(next.workflowStep);
    setCustomPrompt(next.customPrompt);
    setNegativePrompt(next.negativePrompt);
    setStylePreset(next.stylePreset);
    setVideoPrompt(next.videoPrompt);
    setVideoDuration(next.videoDuration);
    setVideoMode(next.videoMode);
    setEdit(next.edit);
    setAiEngines(next.aiEngines);
    setStudioMode(next.studioMode);
    setUseAiBackground(next.useAiBackground);
    setHighQualityBackground(next.highQualityBackground);
    setCutoutUrl(next.cutoutUrl);
  }, []);

  const showToastRef = React.useRef<(message: string) => void>(() => {});

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }

  showToastRef.current = showToast;

  const stableShowToast = React.useCallback((message: string) => {
    showToastRef.current(message);
  }, []);

  const {
    projects,
    loadingProjects,
    activeProjectId,
    saving,
    refreshProjects,
    openProject,
    startNewProject,
    markPublished,
  } = useStudioProjectPersistence({
    form: {
      state,
      mode,
      workflowStep,
      customPrompt,
      negativePrompt,
      stylePreset,
      videoPrompt,
      videoDuration,
      videoMode,
      workspaceUploadMode: "site-banner",
      publishTarget: "heroImage",
      productTitle: "",
      productDescription: "",
      productPrice: "",
      productOriginalPrice: "",
      productType: "natural",
      productCategory: "rings",
      edit,
      aiEngines,
      studioMode,
      useAiBackground,
      highQualityBackground,
      cutoutUrl,
    },
    applyForm,
    showToast: stableShowToast,
  });

  const source = "source" in state ? state.source : null;
  const editImageSource =
    mode === "edit" && edit.asset?.type === "image" ? edit.asset.url : null;
  const activeSource = mode === "create" ? source : editImageSource;
  const useAiStudioFlow =
    mode === "create" || (mode === "edit" && edit.asset?.type === "image");

  const resultUrl =
    state.status === "done"
      ? state.savedUrl ?? state.result
      : null;

  const resultVideoPreviewUrl = React.useMemo(() => {
    if (state.status !== "done" || state.kind !== "video") return null;
    return studioVideoPreviewUrl(state.result, videoPostAdj, { quality: "best" });
  }, [state, videoPostAdj]);

  const canSelectWorkflowStep = React.useCallback(
    (step: StudioWorkflowStep) => {
      if (step === 1) return true;
      if (!activeSource) return false;
      if (step === 4) return state.status === "done";
      return true;
    },
    [activeSource, state.status]
  );

  React.useEffect(() => {
    if (mode === "edit" && edit.asset?.type === "image") {
      if (
        state.status === "empty" ||
        ("source" in state && state.source !== edit.asset.url)
      ) {
        setState({ status: "uploaded", source: edit.asset.url });
      }
    }
  }, [mode, edit.asset?.type, edit.asset?.url, state.status, state]);

  React.useEffect(() => {
    if (!activeSource) {
      setWorkflowStep(1);
    }
  }, [activeSource]);

  function failGeneration(sourceUrl: string, message: string) {
    setState({
      status: "error",
      source: sourceUrl,
      message: humanizeStudioError(message),
    });
  }

  function aiOptions(): GenerateImageOptions {
    return {
      customPrompt,
      stylePreset,
      engines: aiEngines,
      mode: studioMode,
      cutoutUrl: cutoutUrl || undefined,
      useAiBackground: studioMode === "marketing" && useAiBackground,
      highQualityBackground:
        studioMode === "marketing" && useAiBackground && highQualityBackground,
      projectId: activeProjectId ?? undefined,
    };
  }

  function videoOptions(): GenerateVideoOptions {
    const motionMode =
      studioMode === "catalog" ? "preserve" : videoMotionMode;
    return {
      customPrompt: videoPrompt || customPrompt,
      negativePrompt,
      duration: videoDuration,
      mode: videoMode,
      stylePreset,
      engines: aiEngines,
      studioMode,
      motionMode,
      skipImagePipeline: Boolean(lastCompositeUrl),
      projectId: activeProjectId ?? undefined,
    };
  }

  React.useEffect(() => {
    if (studioMode === "catalog") {
      setVideoMotionMode("preserve");
    }
  }, [studioMode]);

  async function runCutoutStep(
    sourceUrl: string
  ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    if (cutoutUrl) {
      return { ok: true, url: cutoutUrl };
    }

    setState({
      status: "generating",
      source: sourceUrl,
      kind: "image",
      step: "cutout",
    });
    const cutout = await studioApiRemoveBackground(sourceUrl, {
      engines: aiEngines,
      mode: studioMode,
      projectId: activeProjectId ?? undefined,
    });
    if (!cutout.ok) {
      failGeneration(sourceUrl, cutout.error);
      return cutout;
    }

    setCutoutUrl(cutout.data.url);
    setState({
      status: "cutout-preview",
      source: sourceUrl,
      cutoutUrl: cutout.data.url,
      kind: "image",
    });
    return { ok: true, url: cutout.data.url };
  }

  async function runCompositeStep(
    sourceUrl: string,
    resolvedCutoutUrl: string
  ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    setState({
      status: "generating",
      source: sourceUrl,
      kind: "image",
      step: "background",
    });
    setState({
      status: "generating",
      source: sourceUrl,
      kind: "image",
      step: "composite",
    });

    const composite = await studioApiCompositeImage(resolvedCutoutUrl, {
      ...aiOptions(),
      cutoutUrl: resolvedCutoutUrl,
    });
    if (!composite.ok) {
      failGeneration(sourceUrl, composite.error);
      return composite;
    }

    setLastCompositeUrl(composite.data.url);
    return { ok: true, url: composite.data.url };
  }

  async function generateImagePipeline(
    sourceUrl: string,
    skipCutoutPreview = false
  ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    let resolvedCutout = cutoutUrl;

    if (!resolvedCutout) {
      const cutout = await runCutoutStep(sourceUrl);
      if (!cutout.ok) return cutout;
      resolvedCutout = cutout.url;
      if (!skipCutoutPreview) {
        return {
          ok: false,
          error: "__CUTOUT_PREVIEW__",
        };
      }
    }

    return runCompositeStep(sourceUrl, resolvedCutout);
  }

  async function generateVariantPresets() {
    if (!cutoutUrl || !activeSource) return;
    const presets: StudioStylePresetId[] = [
      "black-velvet",
      "white-studio",
      "jerusalem-stone",
    ].filter((p) => p !== stylePreset) as StudioStylePresetId[];

    setWorkflowStep(3);
    for (const preset of presets.slice(0, 2)) {
      const composite = await studioApiCompositeImage(cutoutUrl, {
        ...aiOptions(),
        cutoutUrl,
        stylePreset: preset,
      });
      if (composite.ok) {
        await persistToContentLibrary("image", activeSource, composite.data.url);
        showToast(`וריאנט ${preset} נשמר בספרייה`);
      }
    }
  }

  async function publishResultToCatalog() {
    if (!resultUrl) return;
    const price = Number(productPrice);
    if (!productTitle.trim()) {
      showToast("הזינו שם מוצר");
      return;
    }
    if (!productPrice || Number.isNaN(price) || price < 0) {
      showToast("הזינו מחיר תקין");
      return;
    }
    setBusy("catalog");
    try {
      const { productId } = await publishProductToCatalog({
        title: productTitle,
        price,
        category: productCategory,
        type: "natural",
        imageUrl: resultUrl,
      });
      showToast(`המוצר נוסף למלאי (#${productId})`);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "הוספה למלאי נכשלה"
      );
    } finally {
      setBusy(null);
    }
  }

  async function persistToContentLibrary(
    kind: "image" | "video",
    sourceUrl: string,
    resultUrl: string
  ): Promise<string> {
    setBusy("library");
    try {
      const { url } = await saveAssetToCloudinary(resultUrl, kind);
      await saveToMediaLibrary(kind, sourceUrl, url);
      return url;
    } finally {
      setBusy(null);
    }
  }

  function replaceActiveSource(url: string) {
    setState({ status: "uploaded", source: url });
    setCutoutUrl("");
    setLastCompositeUrl("");
    if (mode === "edit" && edit.asset?.type === "image") {
      setEdit((prev) => ({
        ...prev,
        asset: prev.asset ? { ...prev.asset, url, originalUrl: prev.asset.originalUrl || prev.asset.url } : null,
        savedUrl: null,
      }));
    }
  }

  function setUploadedSource(url: string) {
    setState({ status: "uploaded", source: url });
    setCutoutUrl("");
    setLastCompositeUrl("");
    setSourcePrepAdj(DEFAULT_IMAGE_ADJUSTMENTS);
    if (mode === "edit") {
      setEdit((prev) => ({
        ...prev,
        asset: {
          url,
          originalUrl: url,
          type: "image",
          duration: null,
        },
        imageAdj: DEFAULT_IMAGE_ADJUSTMENTS,
        videoAdj: DEFAULT_VIDEO_ADJUSTMENTS,
        savedUrl: null,
      }));
    }
    setWorkflowStep(1);
  }

  function handleEditMediaUpload(info: unknown) {
    if (typeof info !== "object" || !info || !("secure_url" in info)) {
      return;
    }
    const data = info as {
      secure_url: string;
      resource_type?: string;
      duration?: number;
    };
    const type = data.resource_type === "video" ? "video" : "image";

    if (type === "image") {
      setUploadedSource(data.secure_url);
      showToast("תמונה נטענה — ניתן למטב או להשלים ב-AI לפני יצירה");
      return;
    }

    setState({ status: "empty" });
    setEdit((prev) => ({
      ...prev,
      asset: {
        url: data.secure_url,
        originalUrl: data.secure_url,
        type: "video",
        duration: typeof data.duration === "number" ? data.duration : null,
      },
      imageAdj: DEFAULT_IMAGE_ADJUSTMENTS,
      videoAdj: DEFAULT_VIDEO_ADJUSTMENTS,
      savedUrl: null,
    }));
    setWorkflowStep(2);
    showToast("וידאו נטען לעריכה");
  }

  async function generate(kind: "image" | "video") {
    if (!activeSource || isGenerating) return;

    setWorkflowStep(3);

    try {
      if (kind === "image") {
        setState({ status: "generating", source: activeSource, kind: "image" });
        const pipeline = await generateImagePipeline(activeSource);
        if (!pipeline.ok) {
          if (pipeline.error === "__CUTOUT_PREVIEW__") {
            setWorkflowStep(3);
            showToast("בדקו את ה-cutout ולחצו המשך");
            return;
          }
          failGeneration(activeSource, pipeline.error);
          return;
        }
        const savedUrl = await persistToContentLibrary(
          "image",
          activeSource,
          pipeline.url
        );
        setState({
          status: "done",
          source: activeSource,
          kind: "image",
          result: pipeline.url,
          savedUrl,
        });
        setWorkflowStep(4);
        showToast("נשמר בהצלחה בספריית התוכן");
        return;
      }

      if (
        studioMode === "marketing" &&
        videoMotionMode === "ai" &&
        !window.confirm("יצירת וידאו AI היא פעולה יקרה (+1 קריאת API). להמשיך?")
      ) {
        return;
      }

      setState({
        status: "generating",
        source: activeSource,
        kind: "video",
        step: cutoutUrl ? "composite" : "cutout",
      });
      showToast("יוצר וידאו — זה עשוי לקחת עד דקה...");

      let frameUrl: string | null = null;

      if (cutoutUrl) {
        const videoComposite = await studioApiCompositeImage(cutoutUrl, {
          ...aiOptions(),
          forVideo: true,
          cutoutUrl,
        });
        if (videoComposite.ok) {
          frameUrl = videoComposite.data.url;
        }
      }

      if (!frameUrl) {
        showToast("יוצרים תמונת בסיס לווידאו...");
        const cutout = cutoutUrl
          ? ({ ok: true as const, url: cutoutUrl })
          : await runCutoutStep(activeSource);
        if (!cutout.ok) {
          if (cutout.error === "__CUTOUT_PREVIEW__") {
            showToast("השלימו cutout לפני וידאו");
            return;
          }
          failGeneration(activeSource, cutout.error);
          return;
        }

        const videoComposite = await studioApiCompositeImage(cutout.url, {
          ...aiOptions(),
          forVideo: true,
          cutoutUrl: cutout.url,
        });
        if (!videoComposite.ok) {
          failGeneration(activeSource, videoComposite.error);
          return;
        }
        frameUrl = videoComposite.data.url;
      }

      setState({ status: "generating", source: activeSource, kind: "video", step: "composite" });
      const video = await studioApiGenerateVideo(frameUrl, videoOptions());
      if (!video.ok) {
        failGeneration(activeSource, video.error);
        return;
      }

      const savedUrl = await persistToContentLibrary(
        "video",
        activeSource,
        video.data.url
      );
      setVideoPostAdj(JEWELRY_CATALOG_VIDEO_PREVIEW_ADJUSTMENTS);
      setState({
        status: "done",
        source: activeSource,
        kind: "video",
        result: video.data.url,
        videoProvider: video.data.provider,
        savedUrl,
      });
      setWorkflowStep(4);
      showToast("נשמר בהצלחה בספריית התוכן");
    } catch (error) {
      failGeneration(
        activeSource,
        error instanceof Error ? error.message : "היצירה נכשלה"
      );
    }
  }

  async function continueAfterCutoutPreview() {
    if (state.status !== "cutout-preview" || !cutoutUrl) return;
    const sourceUrl = state.source;
    const pipeline = await runCompositeStep(sourceUrl, cutoutUrl);
    if (!pipeline.ok) {
      failGeneration(sourceUrl, pipeline.error);
      return;
    }
    const savedUrl = await persistToContentLibrary(
      "image",
      sourceUrl,
      pipeline.url
    );
    setState({
      status: "done",
      source: sourceUrl,
      kind: "image",
      result: pipeline.url,
      savedUrl,
    });
    setWorkflowStep(4);
    showToast("נשמר בהצלחה בספריית התוכן");
  }

  async function handleCopyUrl() {
    if (!resultUrl) return;
    await navigator.clipboard.writeText(resultUrl);
    showToast("הקישור הועתק");
  }

  function handleDownload() {
    if (!resultUrl) return;
    const anchor = document.createElement("a");
    anchor.href = resultUrl;
    anchor.download = state.status === "done" && state.kind === "video"
      ? "yerushalmi-jewelry.mp4"
      : "yerushalmi-jewelry.png";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }

  function useResultAsSource() {
    if (state.status !== "done" || state.kind !== "image") return;
    const next = state.savedUrl ?? state.result;
    setState({ status: "uploaded", source: next });
    showToast("התוצאה הוגדרה כצילום מקור לעריכה נוספת");
  }

  const isGenerating = state.status === "generating";
  const isCutoutPreview = state.status === "cutout-preview";

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      {toast && (
        <div className="sticky top-0 z-20 flex items-center justify-center gap-2 rounded-none border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-light text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* כותרת */}
      <div className="text-center">
        <Sparkles
          aria-hidden
          className="mx-auto h-8 w-8 text-gold-dark"
          strokeWidth={0.75}
        />
        <h1 className="mt-4 font-serif text-3xl font-light tracking-wide sm:text-4xl">
          סטודיו יצירת תוכן AI
        </h1>
        <p className="mt-3 text-sm font-light text-muted-foreground">
          צרו תמונות ווידאו מצילום גלם — או ערכו ומטבו חומר קיים שלכם
        </p>
        {saving && (
          <p className="mt-2 text-[11px] font-light text-muted-foreground">
            שומר עבודה...
          </p>
        )}
        {activeProjectId && !saving && (
          <p className="mt-2 text-[11px] font-light text-emerald-800">
            עבודה #{activeProjectId} נשמרה בתיק העבודות
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        <StudioPortfolioPanel
          projects={projects}
          activeProjectId={activeProjectId}
          loading={loadingProjects}
          onRefresh={async () => {
            await refreshProjects();
          }}
          onSelect={openProject}
          onNewProject={startNewProject}
          showToast={showToast}
        />

        <div className="space-y-8">
      {/* בורר מצב עבודה */}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          aria-pressed={mode === "create"}
          onClick={() => setMode("create")}
          className={`flex items-center gap-2 border px-5 py-2.5 text-xs font-light tracking-[0.1em] transition-colors ${
            mode === "create"
              ? "border-gold bg-gold/15 text-gold-dark"
              : "border-border/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
          }`}
        >
          <Wand2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          צילום ← תמונת יוקרה
        </button>
        <button
          type="button"
          aria-pressed={mode === "edit"}
          onClick={() => setMode("edit")}
          className={`flex items-center gap-2 border px-5 py-2.5 text-xs font-light tracking-[0.1em] transition-colors ${
            mode === "edit"
              ? "border-gold bg-gold/15 text-gold-dark"
              : "border-border/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
          }`}
        >
          <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          עריכה ומיטוב חומר קיים
        </button>
      </div>

      {mode === "edit" && !useAiStudioFlow && (
        <StudioMediaEditor
          showToast={showToast}
          edit={edit}
          onEditChange={setEdit}
          onPublished={markPublished}
          onUpload={handleEditMediaUpload}
          workflowStep={workflowStep}
          onWorkflowStepChange={setWorkflowStep}
          projectId={activeProjectId}
          studioMode={studioMode}
          onStudioModeChange={setStudioMode}
          stylePreset={stylePreset}
          onStylePresetChange={setStylePreset}
          customPrompt={customPrompt}
          onCustomPromptChange={setCustomPrompt}
          aiEngines={aiEngines}
          onAiEnginesChange={setAiEngines}
          useAiBackground={useAiBackground}
          onUseAiBackgroundChange={setUseAiBackground}
          highQualityBackground={highQualityBackground}
          onHighQualityBackgroundChange={setHighQualityBackground}
          videoDuration={videoDuration}
          onVideoDurationChange={setVideoDuration}
          videoMode={videoMode}
          onVideoModeChange={setVideoMode}
        />
      )}

      {useAiStudioFlow && (
        <>
      <StudioTipsPanel />

      <StudioWorkflowStepper
        current={workflowStep}
        onSelect={setWorkflowStep}
        canSelect={canSelectWorkflowStep}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,420px)]">
        {/* עמודת תצוגה — מקור + תוצאה */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="rounded-none border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                תצוגה מקדימה
              </CardTitle>
              {(activeSource ||
                (state.status === "done" && state.result)) && (
                <p className="text-[10px] font-light text-muted-foreground">
                  לחצו על תמונה או וידאו להגדלה
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                    מקור
                  </p>
                  <div className="relative aspect-square overflow-hidden border border-border/60 bg-stone-100">
                    {activeSource ? (
                      <MediaPreviewTrigger
                        url={activeSource}
                        type="image"
                        alt="הצילום המקורי"
                        className="absolute inset-0 block h-full w-full"
                      >
                        <Image
                          src={activeSource}
                          alt="הצילום המקורי"
                          fill
                          sizes="(max-width: 1024px) 50vw, 30vw"
                          className="object-contain"
                          unoptimized
                        />
                      </MediaPreviewTrigger>
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-xs font-light text-muted-foreground">
                        העלו צילום כדי להתחיל
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                    תוצאה
                  </p>
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200">
                    {activeSource && state.status === "generating" && (
                      <div className="flex flex-col items-center gap-3 px-4 text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-foreground/60" />
                        <p className="text-xs font-light text-muted-foreground">
                          {LOADING_MESSAGES[state.kind]}
                        </p>
                      </div>
                    )}
                    {activeSource && state.status === "done" && state.kind === "image" && (
                      <MediaPreviewTrigger
                        url={state.result}
                        type="image"
                        alt="תוצאת AI"
                        className="absolute inset-0 block h-full w-full"
                      >
                        <Image
                          src={state.result}
                          alt="תוצאת AI"
                          fill
                          sizes="(max-width: 1024px) 50vw, 30vw"
                          className="bg-stone-900/5 object-contain"
                          unoptimized
                        />
                      </MediaPreviewTrigger>
                    )}
                    {activeSource && state.status === "done" && state.kind === "video" && resultVideoPreviewUrl && (
                      <MediaPreviewTrigger
                        url={resultVideoPreviewUrl}
                        type="video"
                        alt="תוצאת וידאו"
                        className="absolute inset-0 block h-full w-full"
                      >
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video
                          key={resultVideoPreviewUrl}
                          src={resultVideoPreviewUrl}
                          muted
                          playsInline
                          preload="metadata"
                          className="pointer-events-none h-full w-full object-contain"
                        />
                      </MediaPreviewTrigger>
                    )}
                    {activeSource && isCutoutPreview && (
                      <p className="px-4 text-center text-xs font-light text-gold-dark">
                        בדקו את ה-cutout למטה ולחצו «המשך להרכבה»
                      </p>
                    )}
                    {activeSource && state.status === "error" && (
                      <p className="px-4 text-center text-xs font-light text-destructive">
                        {state.message}
                      </p>
                    )}
                    {(!activeSource || state.status === "uploaded" || state.status === "empty") && (
                      <p className="px-4 text-center text-xs font-light text-muted-foreground">
                        {activeSource
                          ? "לחצו «עצב בסגנון יוקרתי» ליצירה"
                          : "כאן תופיע התוצאה"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {isCutoutPreview && cutoutUrl && (
                <div className="space-y-3 rounded-none border border-gold/40 bg-gold/5 p-3">
                  <p className="text-[11px] font-light text-gold-dark">
                    בדקו שהתכשיט נשמר במלואו (אבנים, שיניים, מתכת)
                  </p>
                  <div className="relative mx-auto aspect-square max-w-[240px] overflow-hidden border border-border/60 bg-gradient-to-br from-stone-200 to-stone-300">
                    <Image
                      src={cutoutDisplayUrl(cutoutUrl)}
                      alt="תצוגת cutout"
                      fill
                      sizes="240px"
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      onClick={continueAfterCutoutPreview}
                      className="flex-1 rounded-none text-xs font-light"
                    >
                      המשך להרכבה
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCutoutUrl("");
                        if (activeSource) void runCutoutStep(activeSource);
                      }}
                      className="flex-1 rounded-none text-xs font-light"
                    >
                      נסה cutout שוב
                    </Button>
                  </div>
                </div>
              )}
              {state.status === "generating" && state.kind === "image" && state.step && (
                <ul className="space-y-1 text-[11px] font-light text-muted-foreground">
                  {STUDIO_PIPELINE_STEPS.map((step, index) => {
                    const activeIndex = STUDIO_PIPELINE_STEPS.findIndex(
                      (s) => s.id === state.step
                    );
                    const isDone = index < activeIndex;
                    const isActive = step.id === state.step;
                    return (
                      <li
                        key={step.id}
                        className={
                          isActive
                            ? "text-gold-dark"
                            : isDone
                              ? "text-emerald-700"
                              : undefined
                        }
                      >
                        {isDone ? "✓ " : isActive ? "▸ " : "· "}
                        {step.label}
                      </li>
                    );
                  })}
                </ul>
              )}
              {state.status === "done" && (
                <p className="text-center text-[11px] font-light text-emerald-800">
                  ✓ נשמר בספריית התוכן — פרסמו למלאי מאזור הניהול
                  {state.kind === "video" && state.videoProvider && (
                    <span className="mt-1 block text-muted-foreground">
                      {state.videoProvider === "preserve"
                        ? "וידאו קטלוגי — זום עדין, תכשיט ללא שינוי צורה"
                        : state.videoProvider === "veo"
                          ? "וידאו Veo 3.1 — מצלמה קבועה, תנועת אור עדינה"
                          : "וידאו Kling 3 Pro — מצלמה קבועה, תנועת אור עדינה"}
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* עמודת הגדרות — לפי שלב */}
        <div className="space-y-4">
      {/* שלב 1 — העלאה */}
      {(workflowStep === 1 || !activeSource) && (
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 1 · {mode === "edit" ? "העלאת חומר קיים" : "העלאת צילום"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSource ? (
            <div className="space-y-3">
              <p className="text-sm font-light text-emerald-800">
                ✓ {mode === "edit" ? "חומר" : "צילום"} הועלה — ניתן למטב למטה או
                להמשיך לסגנון
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setWorkflowStep(2)}
                  className="rounded-none text-xs font-light"
                >
                  המשך לסגנון
                </Button>
                <CldUploadWidget
                  uploadPreset={
                    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
                  }
                  options={{
                    maxFiles: 1,
                    multiple: false,
                    folder: "yerushalmi-studio",
                    resourceType: mode === "edit" ? "auto" : "image",
                  }}
                  onSuccess={(result) => {
                    if (
                      typeof result.info === "object" &&
                      result.info &&
                      "secure_url" in result.info
                    ) {
                      if (mode === "edit") {
                        handleEditMediaUpload(result.info);
                        return;
                      }
                      setUploadedSource(result.info.secure_url as string);
                      showToast("צילום חדש הועלה");
                    }
                  }}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => open()}
                      className="rounded-none text-xs font-light"
                    >
                      <ImagePlus className="ml-1.5 h-3.5 w-3.5" />
                      החלפת צילום
                    </Button>
                  )}
                </CldUploadWidget>
              </div>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
              options={{
                maxFiles: 1,
                multiple: false,
                folder: "yerushalmi-studio",
                resourceType: mode === "edit" ? "auto" : "image",
              }}
              onSuccess={(result) => {
                if (
                  typeof result.info === "object" &&
                  result.info &&
                  "secure_url" in result.info
                ) {
                  if (mode === "edit") {
                    handleEditMediaUpload(result.info);
                    return;
                  }
                  setUploadedSource(result.info.secure_url as string);
                  showToast("הצילום הועלה — ניתן למטב או להשלים ב-AI לפני יצירה");
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed border-gold/40 bg-gold/5 py-12 transition-colors hover:border-gold/60 hover:bg-gold/10"
                >
                  <ImagePlus
                    aria-hidden
                    className="h-10 w-10 text-gold-dark"
                    strokeWidth={0.75}
                  />
                  <span className="font-serif text-lg font-light">
                    {mode === "edit"
                      ? "העלאת תמונה או וידאו מהמחשב"
                      : "העלאת צילום גולמי"}
                  </span>
                  <span className="text-xs font-light tracking-[0.1em] text-muted-foreground">
                    {mode === "edit"
                      ? "תמונות: JPG / PNG / WEBP · וידאו: MP4 / MOV"
                      : "JPG / PNG · מינימום 2000×2000 · רקע אחיד · חד (macro)"}
                  </span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </CardContent>
      </Card>
      )}

      {workflowStep === 1 && activeSource && useAiStudioFlow && (
        <StudioSourcePrep
          sourceUrl={activeSource}
          adjustments={sourcePrepAdj}
          onAdjustmentsChange={setSourcePrepAdj}
          onSourceUpdated={replaceActiveSource}
          showToast={showToast}
          studioMode={studioMode}
          projectId={activeProjectId}
          disabled={isGenerating}
        />
      )}

      {workflowStep >= 2 && (
      <Card
        className={`rounded-none border-border/60 shadow-none ${!activeSource ? "opacity-90" : ""}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 2 · סגנון רקע ותאורה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!activeSource && (
            <p className="rounded-none border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-light text-amber-900">
              העלו צילום בשלב 1 כדי לבחור סגנון.
            </p>
          )}

          <StudioCreativeOptionsPanel
            studioMode={studioMode}
            onStudioModeChange={setStudioMode}
            stylePreset={stylePreset}
            onStylePresetChange={setStylePreset}
            customPrompt={customPrompt}
            onCustomPromptChange={setCustomPrompt}
            aiEngines={aiEngines}
            onAiEnginesChange={setAiEngines}
            useAiBackground={useAiBackground}
            onUseAiBackgroundChange={setUseAiBackground}
            highQualityBackground={highQualityBackground}
            onHighQualityBackgroundChange={setHighQualityBackground}
            videoDuration={videoDuration}
            onVideoDurationChange={setVideoDuration}
            videoMode={videoMode}
            onVideoModeChange={setVideoMode}
            videoMotionMode={videoMotionMode}
            onVideoMotionModeChange={setVideoMotionMode}
            videoPrompt={videoPrompt}
            onVideoPromptChange={setVideoPrompt}
            negativePrompt={negativePrompt}
            onNegativePromptChange={setNegativePrompt}
            showVideoSettings={studioMode === "marketing"}
            disabled={!activeSource || isGenerating}
          />

          <Separator className="bg-border/40" />

          <div className="rounded-none border border-gold/30 bg-gold/5 p-4 text-[11px] font-light leading-relaxed text-muted-foreground">
            לאחר היצירה, הנכס יישמר אוטומטית ב
            <span className="text-gold-dark"> ספריית התוכן </span>
            — פרסום למלאי או לאתר יתבצע מאזור הניהול.
          </div>

          <Button
            type="button"
            disabled={!activeSource || isGenerating}
            onClick={() => setWorkflowStep(3)}
            className="w-full rounded-none text-xs font-light tracking-[0.15em]"
          >
            המשך ליצירה
          </Button>
        </CardContent>
      </Card>
      )}

      {workflowStep >= 3 && (
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 3 · יצירת תמונה או וידאו
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
            סגנון:{" "}
            <span className="text-foreground">
              {STUDIO_STYLE_PRESETS.find((p) => p.id === stylePreset)?.label}
            </span>
            {studioMode === "marketing" && (
              <>
                {" "}
                · וידאו:{" "}
                {videoMotionMode === "preserve" ? "זום עדין" : "AI (Veo/Kling)"}
              </>
            )}
          </p>

          {studioMode === "marketing" && (
            <StudioVideoAudioPanel
              adjustments={videoPostAdj}
              onChange={setVideoPostAdj}
              disabled={!activeSource || isGenerating}
            />
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="button"
              disabled={!activeSource || isGenerating || isCutoutPreview}
              onClick={() => void generate("image")}
              className="w-full rounded-none text-xs font-light tracking-[0.15em]"
            >
              {isGenerating && state.status === "generating" && state.kind === "image" ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="ml-2 h-4 w-4" strokeWidth={1.5} />
              )}
              עצב בסגנון יוקרתי
            </Button>
            <Button
              type="button"
              disabled={!activeSource || isGenerating || isCutoutPreview}
              onClick={() => void generate("video")}
              variant="outline"
              className="w-full rounded-none text-xs font-light tracking-[0.15em]"
            >
              {isGenerating && state.status === "generating" && state.kind === "video" ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Clapperboard className="ml-2 h-4 w-4" strokeWidth={1.5} />
              )}
              {studioMode === "catalog" || videoMotionMode === "preserve"
                ? "צור וידאו קטלוגי (זום עדין)"
                : "צור וידאו AI (+API)"}
            </Button>
            {cutoutUrl && (
              <Button
                type="button"
                variant="secondary"
                disabled={isGenerating}
                onClick={() => void generateVariantPresets()}
                className="w-full rounded-none text-xs font-light"
              >
                עוד סגנונות מאותו cutout (ללא cutout נוסף)
              </Button>
            )}
            {activeSource && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isGenerating}
                onClick={() => {
                  applyForm(emptyStudioForm());
                  startNewProject();
                }}
                className="text-xs font-light text-muted-foreground"
              >
                <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
                התחלה מחדש
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {workflowStep >= 4 &&
        state.status === "done" &&
        state.kind === "video" &&
        resultUrl && (
          <StudioVideoPrep
            videoUrl={resultUrl}
            adjustments={videoPostAdj}
            onAdjustmentsChange={setVideoPostAdj}
            onVideoUpdated={async (url) => {
              setState((prev) =>
                prev.status === "done" && prev.kind === "video"
                  ? { ...prev, result: url, savedUrl: url }
                  : prev
              );
              setVideoPostAdj(DEFAULT_VIDEO_ADJUSTMENTS);
              if (activeSource) {
                try {
                  await persistToContentLibrary("video", activeSource, url);
                  showToast("נשמר בהצלחה בספריית התוכן");
                } catch (error) {
                  showToast(
                    error instanceof Error
                      ? error.message
                      : "השמירה לספריית התוכן נכשלה"
                  );
                }
              }
            }}
            showToast={showToast}
            studioMode={studioMode}
            projectId={activeProjectId}
            disabled={isGenerating}
            title="מיטוב הווידאו לאחר יצירה"
            videoDuration={videoDuration}
            stylePreset={stylePreset}
          />
        )}

      {/* שלב 4 — ספריית תוכן */}
      {workflowStep >= 4 && state.status === "done" && activeSource && (
            <Card className="rounded-none border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                  שלב 4 · ספריית התוכן
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="rounded-none border border-emerald-200/80 bg-emerald-50/60 px-3 py-2 text-center text-xs font-light text-emerald-900">
                  נשמר בהצלחה בספריית התוכן
                </p>

                {state.kind === "image" && (
                  <div className="space-y-3 rounded-none border border-border/60 p-4">
                    <p className="text-xs font-light text-muted-foreground">
                      הוספה מהירה למלאי
                    </p>
                    <input
                      type="text"
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      placeholder="שם המוצר"
                      className="flex h-10 w-full rounded-none border border-input bg-background px-3 text-sm font-light"
                    />
                    <input
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="מחיר (₪)"
                      className="flex h-10 w-full rounded-none border border-input bg-background px-3 text-sm font-light"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => void publishResultToCatalog()}
                      className="w-full rounded-none text-xs font-light"
                    >
                      הוסף למלאי
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    disabled={busy !== null}
                    onClick={() => generate(state.kind)}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    <RotateCcw className="ml-2 h-4 w-4" />
                    יצירה מחדש
                  </Button>

                  <Button
                    variant="outline"
                    disabled={!resultUrl}
                    onClick={handleDownload}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    <Download className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    הורדה למחשב
                  </Button>

                  <Button
                    variant="outline"
                    disabled={!resultUrl}
                    onClick={handleCopyUrl}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    <Copy className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    העתקת קישור
                  </Button>

                  {state.kind === "image" && (
                    <Button
                      variant="ghost"
                      onClick={useResultAsSource}
                      className="rounded-none text-xs font-light tracking-[0.1em]"
                    >
                      <Wand2 className="ml-2 h-4 w-4" />
                      המשך עריכה מהתוצאה
                    </Button>
                  )}
                </div>

                <Button
                  asChild
                  className="w-full rounded-none text-xs font-light tracking-[0.15em]"
                >
                  <Link href="/workspace/content-library">
                    <FolderHeart className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    עבור לספריית התוכן
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
        </>
      )}
        </div>
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl py-16 text-center text-sm font-light text-muted-foreground">
          טוען סטודיו...
        </div>
      }
    >
      <StudioPageContent />
    </Suspense>
  );
}
