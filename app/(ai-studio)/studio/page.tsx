"use client";

import * as React from "react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  ArrowLeft,
  CheckCircle2,
  Clapperboard,
  CloudUpload,
  Copy,
  Download,
  Globe,
  ImagePlus,
  Loader2,
  PackagePlus,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  publishImageToSite,
  publishProductToCatalog,
  saveAssetToCloudinary,
} from "./actions";
import {
  humanizeStudioError,
  studioApiCompositeImage,
  studioApiGenerateVideo,
  studioApiRemoveBackground,
} from "@/lib/studio-api";
import type { GenerateImageOptions, GenerateVideoOptions } from "@/lib/studio-types";
import { StudioMediaEditor } from "@/components/studio/media-editor";
import { StudioPortfolioPanel } from "@/components/studio/studio-portfolio-panel";
import { StylePresetGrid } from "@/components/studio/style-preset-grid";
import { StudioTipsPanel } from "@/components/studio/studio-tips-panel";
import {
  emptyStudioForm,
  useStudioProjectPersistence,
  type StudioFormState,
} from "@/components/studio/use-studio-project-persistence";
import type { StudioClientState } from "@/lib/studio-project-snapshot";
import {
  StudioWorkflowStepper,
  type StudioWorkflowStep,
} from "@/components/studio/studio-workflow-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  STUDIO_PIPELINE_STEPS,
  STUDIO_PROMPT_EXAMPLES,
  STUDIO_PUBLISH_TARGETS,
  STUDIO_STYLE_PRESETS,
  STUDIO_VIDEO_PROMPT_EXAMPLES,
  STUDIO_WORKSPACE_UPLOAD_MODES,
  type StudioStylePresetId,
  type StudioWorkspaceUploadModeId,
} from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";

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
  const [videoDuration, setVideoDuration] = React.useState<5 | 10>(5);
  const [videoMode, setVideoMode] = React.useState<"standard" | "pro">("pro");
  const [workspaceUploadMode, setWorkspaceUploadMode] =
    React.useState<StudioWorkspaceUploadModeId>("site-banner");
  const [publishTarget, setPublishTarget] =
    React.useState<SettingKey>("heroImage");
  const [productTitle, setProductTitle] = React.useState("");
  const [productDescription, setProductDescription] = React.useState("");
  const [productPrice, setProductPrice] = React.useState("");
  const [productOriginalPrice, setProductOriginalPrice] = React.useState("");
  const [productType, setProductType] =
    React.useState<(typeof PRODUCT_TYPES)[number]["value"]>("natural");
  const [productCategory, setProductCategory] =
    React.useState<(typeof PRODUCT_CATEGORIES)[number]["value"]>("rings");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [workflowStep, setWorkflowStep] =
    React.useState<StudioWorkflowStep>(1);

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
    setWorkspaceUploadMode(next.workspaceUploadMode);
    setPublishTarget(next.publishTarget);
    setProductTitle(next.productTitle);
    setProductDescription(next.productDescription);
    setProductPrice(next.productPrice);
    setProductOriginalPrice(next.productOriginalPrice);
    setProductType(next.productType);
    setProductCategory(
      next.productCategory as (typeof PRODUCT_CATEGORIES)[number]["value"]
    );
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
      workspaceUploadMode,
      publishTarget,
      productTitle,
      productDescription,
      productPrice,
      productOriginalPrice,
      productType,
      productCategory,
    },
    applyForm,
    showToast: stableShowToast,
  });

  const source = "source" in state ? state.source : null;
  const resultUrl =
    state.status === "done"
      ? state.savedUrl ?? state.result
      : null;

  const canSelectWorkflowStep = React.useCallback(
    (step: StudioWorkflowStep) => {
      if (step === 1) return true;
      if (!source) return false;
      if (step === 4) return state.status === "done";
      return true;
    },
    [source, state.status]
  );

  React.useEffect(() => {
    if (!source) {
      setWorkflowStep(1);
    }
  }, [source]);

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
    };
  }

  function videoOptions(): GenerateVideoOptions {
    return {
      customPrompt: videoPrompt,
      negativePrompt,
      duration: videoDuration,
      mode: videoMode,
    };
  }

  async function generateImagePipeline(sourceUrl: string): Promise<
    | { ok: true; url: string }
    | { ok: false; error: string }
  > {
    setState({ status: "generating", source: sourceUrl, kind: "image", step: "cutout" });
    const cutout = await studioApiRemoveBackground(sourceUrl);
    if (!cutout.ok) return cutout;

    setState({ status: "generating", source: sourceUrl, kind: "image", step: "background" });
    setState({ status: "generating", source: sourceUrl, kind: "image", step: "composite" });
    const composite = await studioApiCompositeImage(cutout.data.url, aiOptions());
    if (!composite.ok) return composite;

    return { ok: true, url: composite.data.url };
  }

  async function generate(kind: "image" | "video") {
    if (!source) return;

    setWorkflowStep(3);

    try {
      if (kind === "image") {
        setState({ status: "generating", source, kind: "image" });
        const pipeline = await generateImagePipeline(source);
        if (!pipeline.ok) {
          failGeneration(source, pipeline.error);
          return;
        }
        setState({ status: "done", source, kind: "image", result: pipeline.url });
        setWorkflowStep(4);
        return;
      }

      let frameUrl: string;
      if (state.status === "done" && state.kind === "image") {
        frameUrl = state.result;
      } else {
        showToast("יוצרים תמונת יוקרה כבסיס לווידאו באיכות גבוהה...");
        setState({ status: "generating", source, kind: "image", step: "cutout" });
        const pipeline = await generateImagePipeline(source);
        if (!pipeline.ok) {
          failGeneration(source, pipeline.error);
          return;
        }
        frameUrl = pipeline.url;
      }

      setState({ status: "generating", source, kind: "video" });
      const video = await studioApiGenerateVideo(frameUrl, videoOptions());
      if (!video.ok) {
        failGeneration(source, video.error);
        return;
      }

      setState({
        status: "done",
        source,
        kind: "video",
        result: video.data.url,
        videoProvider: video.data.provider,
      });
      setWorkflowStep(4);
    } catch (error) {
      failGeneration(
        source,
        error instanceof Error ? error.message : "היצירה נכשלה"
      );
    }
  }

  async function handleSaveToCloudinary() {
    if (state.status !== "done") return;

    setBusy("save");
    try {
      const { url } = await saveAssetToCloudinary(
        state.result,
        state.kind
      );
      setState({ ...state, savedUrl: url });
      showToast("הנכס נשמר ב-Cloudinary");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "השמירה נכשלה");
    } finally {
      setBusy(null);
    }
  }

  async function handlePublishToSite() {
    if (state.status !== "done" || state.kind !== "image") return;

    const imageUrl = state.savedUrl;
    if (!imageUrl) {
      showToast("קודם שמרו את התמונה ב-Cloudinary");
      return;
    }

    setBusy("publish");
    try {
      await publishImageToSite(publishTarget, imageUrl);
      await markPublished({ kind: "site", settingKey: publishTarget });
      const label =
        STUDIO_PUBLISH_TARGETS.find((t) => t.key === publishTarget)
          ?.label ?? "האתר";
      showToast(`פורסם בהצלחה: ${label}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "הפרסום נכשל");
    } finally {
      setBusy(null);
    }
  }

  async function handlePublishToCatalog() {
    if (state.status !== "done" || state.kind !== "image") return;

    const imageUrl = state.savedUrl;
    if (!imageUrl) {
      showToast("קודם שמרו את התמונה ב-Cloudinary");
      return;
    }

    const price = Number(productPrice);
    if (!productTitle.trim()) {
      showToast("הזינו שם מוצר בהגדרות הפרסום");
      return;
    }
    if (!productPrice || Number.isNaN(price) || price < 0) {
      showToast("הזינו מחיר תקין בהגדרות הפרסום");
      return;
    }

    const originalPrice = productOriginalPrice
      ? Number(productOriginalPrice)
      : null;

    setBusy("catalog");
    try {
      const { productId } = await publishProductToCatalog({
        title: productTitle,
        description: productDescription,
        price,
        originalPrice,
        type: productType,
        category: productCategory,
        imageUrl,
      });
      await markPublished({ kind: "catalog", productId });
      showToast(`המוצר נוסף למלאי (#${productId})`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ההוספה למלאי נכשלה");
    } finally {
      setBusy(null);
    }
  }

  const selectedPublishTarget = STUDIO_PUBLISH_TARGETS.find(
    (target) => target.key === publishTarget
  );

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

      {mode === "edit" && <StudioMediaEditor showToast={showToast} />}

      {mode === "create" && (
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
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                    מקור
                  </p>
                  <div className="relative aspect-square overflow-hidden border border-border/60 bg-stone-100">
                    {source ? (
                      <Image
                        src={source}
                        alt="הצילום המקורי"
                        fill
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        className="object-contain"
                      />
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
                    {source && state.status === "generating" && (
                      <div className="flex flex-col items-center gap-3 px-4 text-center">
                        <Loader2 className="h-7 w-7 animate-spin text-foreground/60" />
                        <p className="text-xs font-light text-muted-foreground">
                          {LOADING_MESSAGES[state.kind]}
                        </p>
                      </div>
                    )}
                    {source && state.status === "done" && state.kind === "image" && (
                      <Image
                        src={state.result}
                        alt="תוצאת AI"
                        fill
                        sizes="(max-width: 1024px) 50vw, 30vw"
                        className="object-contain bg-stone-900/5"
                      />
                    )}
                    {source && state.status === "done" && state.kind === "video" && (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video
                        src={state.result}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-contain"
                      />
                    )}
                    {source && state.status === "error" && (
                      <p className="px-4 text-center text-xs font-light text-destructive">
                        {state.message}
                      </p>
                    )}
                    {(!source || state.status === "uploaded" || state.status === "empty") && (
                      <p className="px-4 text-center text-xs font-light text-muted-foreground">
                        {source
                          ? "לחצו «עצב בסגנון יוקרתי» ליצירה"
                          : "כאן תופיע התוצאה"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
                <p className="text-center text-[11px] font-light text-muted-foreground">
                  {state.savedUrl
                    ? "✓ נשמר ב-Cloudinary — מוכן לפרסום"
                    : "שמרו ב-Cloudinary בשלב 4 לפני פרסום"}
                  {state.kind === "video" && state.videoProvider === "kling" && (
                    <span className="mt-1 block text-emerald-800">
                      וידאו Kling Pro — מצלמה קבועה, תנועת אור עדינה
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
      {(workflowStep === 1 || !source) && (
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 1 · העלאת צילום
          </CardTitle>
        </CardHeader>
        <CardContent>
          {source ? (
            <div className="space-y-3">
              <p className="text-sm font-light text-emerald-800">
                ✓ צילום הועלה — המשיכו לשלב סגנון
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
                  }}
                  onSuccess={(result) => {
                    if (
                      typeof result.info === "object" &&
                      result.info &&
                      "secure_url" in result.info
                    ) {
                      setState({
                        status: "uploaded",
                        source: result.info.secure_url as string,
                      });
                      setWorkflowStep(2);
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
              }}
              onSuccess={(result) => {
                if (
                  typeof result.info === "object" &&
                  result.info &&
                  "secure_url" in result.info
                ) {
                  setState({
                    status: "uploaded",
                    source: result.info.secure_url as string,
                  });
                  setWorkflowStep(2);
                  showToast("הצילום הועלה — בחרו סגנון רקע");
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
                    העלאת צילום גולמי
                  </span>
                  <span className="text-xs font-light tracking-[0.1em] text-muted-foreground">
                    JPG / PNG · מינימום 2000×2000 · רקע אחיד · חד (macro)
                  </span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </CardContent>
      </Card>
      )}

      {workflowStep >= 2 && (
      <Card
        className={`rounded-none border-border/60 shadow-none ${!source ? "opacity-90" : ""}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 2 · סגנון רקע ותאורה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!source && (
            <p className="rounded-none border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-light text-amber-900">
              העלו צילום בשלב 1 כדי לבחור סגנון.
            </p>
          )}

          <div className="rounded-none border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-[11px] font-light leading-relaxed text-emerald-900">
            התכשיט מועתק מהצילום המקורי — AI משנה רקע ותאורה, לא את התכשיט.
          </div>

          <div className="space-y-2">
            <Label className="font-light">סגנון רקע</Label>
            <StylePresetGrid
              value={stylePreset}
              onChange={setStylePreset}
              disabled={!source || isGenerating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt" className="font-light">
              תאורה ואווירה (אופציונלי)
            </Label>
            <Textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              disabled={!source || isGenerating}
              placeholder="לדוגמה: תאורה דרמטית, השתקפויות זהב, רקע כהה..."
              className="rounded-none resize-none"
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {STUDIO_PROMPT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={!source || isGenerating}
                  onClick={() => setCustomPrompt(example)}
                  className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-border/40" />

          <div className="space-y-4 rounded-none border border-gold/30 bg-gold/5 p-4">
            <div className="space-y-1">
              <Label className="font-light text-gold-dark">
                יעד פרסום (לאחר יצירה)
              </Label>
              <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
                הגדירו לאן התמונה תופיע אחרי שמירה ב-Cloudinary — באנר או מוצר
                חדש.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-light text-muted-foreground">
                סוג העלאה
              </Label>
              <Select
                value={workspaceUploadMode}
                onValueChange={(v) =>
                  setWorkspaceUploadMode(v as StudioWorkspaceUploadModeId)
                }
                disabled={!source || isGenerating}
                dir="rtl"
              >
                <SelectTrigger className="rounded-none bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_WORKSPACE_UPLOAD_MODES.map((mode) => (
                    <SelectItem key={mode.id} value={mode.id}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] font-light text-muted-foreground">
                {
                  STUDIO_WORKSPACE_UPLOAD_MODES.find(
                    (mode) => mode.id === workspaceUploadMode
                  )?.description
                }
              </p>
            </div>

            {workspaceUploadMode === "site-banner" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-light text-muted-foreground">
                    יעד באתר
                  </Label>
                  <Select
                    value={publishTarget}
                    onValueChange={(v) =>
                      setPublishTarget(v as SettingKey)
                    }
                    disabled={!source || isGenerating}
                    dir="rtl"
                  >
                    <SelectTrigger className="rounded-none bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDIO_PUBLISH_TARGETS.map((target) => (
                        <SelectItem key={target.key} value={target.key}>
                          {target.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPublishTarget && (
                  <div className="space-y-2 border border-border/40 bg-background/80 p-3 text-[11px] font-light leading-relaxed text-muted-foreground">
                    <p>{selectedPublishTarget.description}</p>
                    <Link
                      href={selectedPublishTarget.previewPath}
                      className="inline-flex items-center text-gold-dark hover:underline"
                      target="_blank"
                    >
                      <Globe className="ml-1 h-3 w-3" />
                      תצוגה מקדימה באתר
                    </Link>
                  </div>
                )}
              </div>
            )}

            {workspaceUploadMode === "product-catalog" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="product-title" className="font-light">
                    שם המוצר *
                  </Label>
                  <Input
                    id="product-title"
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    disabled={!source || isGenerating}
                    placeholder="לדוגמה: טבעת סוליטר 1.5 קראט"
                    className="rounded-none bg-background"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="product-description" className="font-light">
                    תיאור (אופציונלי)
                  </Label>
                  <Textarea
                    id="product-description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    rows={2}
                    disabled={!source || isGenerating}
                    placeholder="תיאור שיוצג בדף המוצר..."
                    className="rounded-none resize-none bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-price" className="font-light">
                    מחיר (₪) *
                  </Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    disabled={!source || isGenerating}
                    placeholder="0.00"
                    className="rounded-none bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-original-price" className="font-light">
                    מחיר לפני הנחה
                  </Label>
                  <Input
                    id="product-original-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productOriginalPrice}
                    onChange={(e) => setProductOriginalPrice(e.target.value)}
                    disabled={!source || isGenerating}
                    placeholder="אופציונלי"
                    className="rounded-none bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-light">סוג יהלום *</Label>
                  <Select
                    value={productType}
                    onValueChange={(v) =>
                      setProductType(
                        v as (typeof PRODUCT_TYPES)[number]["value"]
                      )
                    }
                    disabled={!source || isGenerating}
                    dir="rtl"
                  >
                    <SelectTrigger className="rounded-none bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-light">קטגוריה *</Label>
                  <Select
                    value={productCategory}
                    onValueChange={(v) =>
                      setProductCategory(
                        v as (typeof PRODUCT_CATEGORIES)[number]["value"]
                      )
                    }
                    disabled={!source || isGenerating}
                    dir="rtl"
                  >
                    <SelectTrigger className="rounded-none bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            disabled={!source || isGenerating}
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
          </p>

          <details className="rounded-none border border-border/40 bg-muted/20 px-3 py-2">
            <summary className="cursor-pointer text-xs font-light tracking-[0.08em] text-muted-foreground">
              הגדרות וידאו Kling (ברירת מחדל: Pro 1080p)
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-light text-muted-foreground">
                    אורך
                  </Label>
                  <Select
                    value={String(videoDuration)}
                    onValueChange={(v) =>
                      setVideoDuration(Number(v) as 5 | 10)
                    }
                    disabled={!source || isGenerating}
                    dir="rtl"
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 שניות</SelectItem>
                      <SelectItem value="10">10 שניות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-light text-muted-foreground">
                    איכות
                  </Label>
                  <Select
                    value={videoMode}
                    onValueChange={(v) =>
                      setVideoMode(v as "standard" | "pro")
                    }
                    disabled={!source || isGenerating}
                    dir="rtl"
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (720p)</SelectItem>
                      <SelectItem value="pro">Pro (1080p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={2}
                disabled={!source || isGenerating}
                placeholder="תנועה לווידאו (אופציונלי): סיבוב איטי, נצנוץ יהלומים..."
                className="rounded-none resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {STUDIO_VIDEO_PROMPT_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={!source || isGenerating}
                    onClick={() => setVideoPrompt(example)}
                    className="border border-border/60 px-2 py-1 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {example}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="negative-prompt"
                  className="text-xs font-light text-muted-foreground"
                >
                  מה להימנע בווידאו (אופציונלי)
                </Label>
                <Textarea
                  id="negative-prompt"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  disabled={!source || isGenerating}
                  placeholder="לדוגמה: שינוי צורת התכשיט, תנועת מצלמה, טשטוש..."
                  className="rounded-none resize-none"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-3 pt-2">
            <Button
              disabled={!source || isGenerating}
              onClick={() => generate("image")}
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
              disabled={!source || isGenerating}
              onClick={() => generate("video")}
              variant="outline"
              className="w-full rounded-none text-xs font-light tracking-[0.15em]"
            >
              {isGenerating && state.status === "generating" && state.kind === "video" ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Clapperboard className="ml-2 h-4 w-4" strokeWidth={1.5} />
              )}
              הפוך לווידאו מנצנץ
            </Button>
            {source && (
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

      {/* שלב 4 — שמירה ופרסום */}
      {workflowStep >= 4 && state.status === "done" && source && (
            <Card className="rounded-none border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                  שלב 4 · שמירה, פרסום והעלאה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
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
                    disabled={busy !== null}
                    onClick={handleSaveToCloudinary}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    {busy === "save" ? (
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    )}
                    שמירה ב-Cloudinary
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

                {state.kind === "image" && (
                  <div className="space-y-4 border border-border/40 p-4">
                    <div className="space-y-1 text-[11px] font-light text-muted-foreground">
                      <p className="text-foreground/80">יעד שהוגדר בשלב 2:</p>
                      {workspaceUploadMode === "site-banner" ? (
                        <p>{selectedPublishTarget?.label ?? "באנר באתר"}</p>
                      ) : (
                        <p>
                          מוצר במלאי
                          {productTitle.trim()
                            ? `: ${productTitle.trim()}`
                            : " — הזינו שם בשלב 2"}
                        </p>
                      )}
                    </div>

                    {workspaceUploadMode === "site-banner" ? (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={busy !== null || !state.savedUrl}
                          onClick={handlePublishToSite}
                          className="rounded-none text-xs font-light tracking-[0.15em]"
                        >
                          {busy === "publish" ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="ml-2 h-4 w-4" strokeWidth={1.5} />
                          )}
                          פרסום באתר
                        </Button>
                        {selectedPublishTarget && (
                          <Button
                            asChild
                            variant="outline"
                            className="rounded-none text-xs font-light tracking-[0.1em]"
                          >
                            <Link
                              href={selectedPublishTarget.previewPath}
                              target="_blank"
                            >
                              <ArrowLeft className="ml-2 h-4 w-4" />
                              צפייה ביעד
                            </Link>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          disabled={busy !== null || !state.savedUrl}
                          onClick={handlePublishToCatalog}
                          className="rounded-none text-xs font-light tracking-[0.15em]"
                        >
                          {busy === "catalog" ? (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          ) : (
                            <PackagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
                          )}
                          הוספה למלאי
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-none text-xs font-light tracking-[0.1em]"
                        >
                          <Link href="/workspace/products">
                            <ArrowLeft className="ml-2 h-4 w-4" />
                            ניהול מלאי
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {state.kind === "video" && (
                  <p className="text-center text-xs font-light text-muted-foreground">
                    <CloudUpload className="ml-1 inline h-3.5 w-3.5" />
                    שמרו את הווידאו ב-Cloudinary ואז הורידו לשימוש ברשתות
                    החברתיות
                  </p>
                )}

                <Button
                  asChild
                  variant="ghost"
                  className="w-full rounded-none text-xs font-light tracking-[0.1em] text-muted-foreground"
                >
                  <Link href="/">
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    צפייה באתר לאחר פרסום
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
