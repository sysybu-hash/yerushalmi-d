"use client";

import * as React from "react";
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
  Lightbulb,
  Loader2,
  PackagePlus,
  RotateCcw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  generateJewelryVideo,
  publishImageToSite,
  publishProductToCatalog,
  saveAssetToCloudinary,
  studioCompositeImage,
  studioRemoveBackground,
  type GenerateImageOptions,
  type GenerateVideoOptions,
} from "./actions";
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
  type StudioPipelineStepId,
  type StudioStylePresetId,
  type StudioWorkspaceUploadModeId,
} from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";

type StudioState =
  | { status: "empty" }
  | { status: "uploaded"; source: string }
  | {
      status: "generating";
      source: string;
      kind: "image" | "video";
      step?: StudioPipelineStepId;
    }
  | {
      status: "done";
      source: string;
      kind: "image" | "video";
      result: string;
      savedUrl?: string;
      videoProvider?: "kling" | "svd";
    }
  | { status: "error"; source: string; message: string };

const LOADING_MESSAGES: Record<"image" | "video", string> = {
  image: "שומר על התכשיט המקורי — מחליף רק את הרקע והתאורה",
  video: "יוצר קליפ וידאו קולנועי — עד 10 שניות",
};

export default function StudioPage() {
  const [state, setState] = React.useState<StudioState>({ status: "empty" });
  const [customPrompt, setCustomPrompt] = React.useState("");
  const [negativePrompt, setNegativePrompt] = React.useState("");
  const [stylePreset, setStylePreset] =
    React.useState<StudioStylePresetId>("luxury-marble");
  const [videoPrompt, setVideoPrompt] = React.useState("");
  const [videoDuration, setVideoDuration] = React.useState<5 | 10>(5);
  const [videoMode, setVideoMode] = React.useState<"standard" | "pro">(
    "standard"
  );
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

  const source = "source" in state ? state.source : null;
  const resultUrl =
    state.status === "done"
      ? state.savedUrl ?? state.result
      : null;

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
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

  async function generateImagePipeline(sourceUrl: string) {
    setState({ status: "generating", source: sourceUrl, kind: "image", step: "cutout" });
    const { url: cutoutUrl } = await studioRemoveBackground(sourceUrl);

    setState({ status: "generating", source: sourceUrl, kind: "image", step: "background" });
    setState({ status: "generating", source: sourceUrl, kind: "image", step: "composite" });
    const { url } = await studioCompositeImage(cutoutUrl, aiOptions());

    return url;
  }

  async function generate(kind: "image" | "video") {
    if (!source) return;

    setState({ status: "generating", source, kind });

    try {
      if (kind === "image") {
        const url = await generateImagePipeline(source);
        setState({ status: "done", source, kind: "image", result: url });
        return;
      }

      const { url, provider } = await generateJewelryVideo(
        source,
        videoOptions()
      );

      setState({
        status: "done",
        source,
        kind: "video",
        result: url,
        videoProvider: provider,
      });
    } catch (error) {
      setState({
        status: "error",
        source,
        message:
          error instanceof Error
            ? error.message
            : "היצירה נכשלה — נסו שוב בעוד רגע",
      });
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
          העלו צילום, כתבו הנחיות ל-AI, צרו, שמרו ופרסמו ישירות לאתר
        </p>
      </div>

      {/* הנחיות שימוש */}
      <Card className="rounded-none border-gold/30 bg-gold/5 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-light tracking-[0.1em] text-gold-dark">
            <Lightbulb className="h-4 w-4" strokeWidth={1.5} />
            הנחיות לעבודה עם ה-AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm font-light leading-relaxed text-foreground/80">
          <p>
            1. העלו צילום גולמי ברור — התכשיט במרכז, תאורה טובה.
          </p>
          <p>
            2. בחרו סגנון רקע והנחיות תאורה — התכשיט נשאר זהה לצילום; רק
            הרקע משתנה.
          </p>
          <p>
            3. לחצו &quot;עצב בסגנון יוקרתי&quot;. המערכת לא מציירת תכשיט
            מחדש.
          </p>
          <p>
            4. בשלב 2 — הגדירו פרסום: באנר באתר (Hero / קולקציה) או מוצר
            חדש במלאי.
          </p>
          <p>
            5. שמרו ב-Cloudinary → פרסמו לפי ההגדרות בשלב 2.
          </p>
        </CardContent>
      </Card>

      <Separator className="bg-border/60" />

      {/* שלב 1 — העלאה */}
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 1 · העלאת צילום
          </CardTitle>
        </CardHeader>
        <CardContent>
          {source ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-border/60 bg-stone-100">
                <Image
                  src={source}
                  alt="הצילום שהועלה"
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-light text-emerald-800">
                  ✓ צילום הועלה — אפשר להגדיר רקע וליצור
                </p>
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
                  showToast("הצילום הועלה — הגדירו רקע ולחצו עיצוב");
                }
              }}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-gold/40 bg-gold/5 py-16 transition-colors hover:border-gold/60 hover:bg-gold/10"
                >
                  <ImagePlus
                    aria-hidden
                    className="h-12 w-12 text-gold-dark"
                    strokeWidth={0.75}
                  />
                  <span className="font-serif text-xl font-light">
                    לחצו כאן להעלאת צילום גולמי
                  </span>
                  <span className="text-xs font-light tracking-[0.1em] text-muted-foreground">
                    JPG / PNG · מומלץ 1000×1000 פיקסלים · רקע אחיד עוזר לבידוד
                  </span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </CardContent>
      </Card>

      {/* שלב 2 — הגדרות (תמיד גלוי) */}
      <Card
        className={`rounded-none border-border/60 shadow-none ${!source ? "opacity-90" : ""}`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 2 · הגדרות יצירה, פרסום והעלאה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {!source && (
            <p className="rounded-none border border-amber-200/80 bg-amber-50 px-3 py-2 text-[11px] font-light text-amber-900">
              העלו צילום בשלב 1 כדי להפעיל את כפתורי העיצוב.
            </p>
          )}

          <div className="rounded-none border border-emerald-200/80 bg-emerald-50/50 px-3 py-2 text-[11px] font-light leading-relaxed text-emerald-900">
            התכשיט שלכם מועתק פיקסל-אחר-פיקסל מהצילום. AI לא משנה את
            הצורה, מספר האבנים או העיצוב.
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-prompt" className="font-light">
              תאורה ואווירת רקע (לא משנה את התכשיט)
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-light">סגנון רקע</Label>
              <Select
                value={stylePreset}
                onValueChange={(v) =>
                  setStylePreset(v as StudioStylePresetId)
                }
                disabled={!source || isGenerating}
                dir="rtl"
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDIO_STYLE_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-border/40" />

          <div className="space-y-3">
            <Label className="font-light">הגדרות וידאו (Kling v2.1)</Label>
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
              <Label htmlFor="negative-prompt" className="text-xs font-light text-muted-foreground">
                מה להימנע בווידאו (אופציונלי)
              </Label>
              <Textarea
                id="negative-prompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                disabled={!source || isGenerating}
                placeholder="לדוגמה: שינוי צורת התכשיט, טשטוש..."
                className="rounded-none resize-none"
              />
            </div>
          </div>

          <Separator className="bg-border/40" />

          <div className="space-y-4 rounded-none border border-gold/30 bg-gold/5 p-4">
            <div className="space-y-1">
              <Label className="font-light text-gold-dark">
                פרסום והעלאה לאזור העבודה
              </Label>
              <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
                הגדירו מראש לאן התמונה תופיע אחרי יצירה ושמירה ב-Cloudinary —
                באנר באתר או מוצר חדש במלאי.
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
                    יעד פרסום באתר
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

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              disabled={!source || isGenerating}
              onClick={() => generate("image")}
              className="rounded-none text-xs font-light tracking-[0.15em]"
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
              className="rounded-none text-xs font-light tracking-[0.15em]"
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
                  setState({ status: "empty" });
                  setCustomPrompt("");
                  setNegativePrompt("");
                  setVideoPrompt("");
                  setProductTitle("");
                  setProductDescription("");
                  setProductPrice("");
                  setProductOriginalPrice("");
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

      {/* שלב 3 — תצוגה (תמיד גלוי) */}
      <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-none border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                שלב 3 · הצילום המקורי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square max-h-[420px] w-full overflow-hidden border border-border/60">
                {source ? (
                  <Image
                    src={source}
                    alt="הצילום המקורי"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-contain bg-stone-100"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm font-light text-muted-foreground">
                    כאן יוצג הצילום לאחר העלאה
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                שלב 3 · התוצאה — אותו תכשיט, רקע חדש
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex aspect-square max-h-[420px] w-full items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200">
                {!source && (
                  <p className="px-6 text-center text-sm font-light text-muted-foreground">
                    כאן תופיע התוצאה לאחר העיצוב
                  </p>
                )}

                {source && state.status === "generating" && (
                    <div className="flex flex-col items-center gap-4 px-6 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
                      <p className="text-sm font-light leading-relaxed text-muted-foreground">
                        {LOADING_MESSAGES[state.kind]}
                      </p>
                      {state.kind === "image" && state.step && (
                          <ul className="space-y-1 text-[11px] font-light text-muted-foreground">
                            {STUDIO_PIPELINE_STEPS.map((step, index) => {
                              const activeIndex =
                                STUDIO_PIPELINE_STEPS.findIndex(
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
                      <p className="text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                        התהליך אורך 1–3 דקות — אל תסגרו את החלון
                      </p>
                    </div>
                  )}

                  {source && state.status === "done" && state.kind === "image" && (
                    <Image
                      src={state.result}
                      alt="תוצאת AI"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
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
                    <p className="px-6 text-center text-sm font-light text-destructive">
                      {state.message}
                    </p>
                  )}

                  {source && state.status === "uploaded" && (
                    <p className="px-6 text-center text-sm font-light text-muted-foreground">
                      הגדירו הנחיות ולחצו על &quot;עצב בסגנון יוקרתי&quot;
                    </p>
                  )}
                </div>

                {state.status === "done" && (
                  <p className="text-center text-[11px] font-light text-muted-foreground">
                    {state.savedUrl
                      ? "✓ נשמר ב-Cloudinary — מוכן לפרסום באתר"
                      : "שמרו ב-Cloudinary לפני פרסום באתר"}
                    {state.kind === "video" && state.videoProvider === "svd" && (
                      <span className="block mt-1 text-amber-700">
                        נוצר ב-SVD (גיבוי) — Kling לא זמין כרגע
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
      </div>

      {/* פעולות על התוצאה */}
      {state.status === "done" && source && (
            <Card className="rounded-none border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                  שמירה, פרסום והעלאה
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
  );
}
