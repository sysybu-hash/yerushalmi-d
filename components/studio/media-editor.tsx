"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  Copy,
  Download,
  FileVideo,
  Globe,
  ImageDown,
  Loader2,
  PackagePlus,
  RotateCcw,
  Save,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import {
  publishImageToSite,
  publishProductToCatalog,
  saveAssetToCloudinary,
} from "@/app/(ai-studio)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";
import { STUDIO_PUBLISH_TARGETS } from "@/lib/studio-presets";
import type { SettingKey } from "@/lib/site-settings";
import {
  ASPECT_OPTIONS,
  DEFAULT_IMAGE_ADJUSTMENTS,
  DEFAULT_VIDEO_ADJUSTMENTS,
  JEWELRY_CATALOG_IMAGE_ADJUSTMENTS,
  buildTransformedUrl,
  hasImageEdits,
  hasVideoEdits,
  type AspectId,
  type ImageAdjustments,
  type MediaResourceType,
  type VideoAdjustments,
} from "@/lib/studio-transform";

type LoadedAsset = {
  url: string;
  type: MediaResourceType;
  duration: number | null;
};

/** סליידר נגיש פשוט עם תווית ערך */
function AdjustSlider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-light text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-foreground/70">{value}</span>
      </div>
      <input
        type="range"
        min={-50}
        max={50}
        step={5}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={label}
      />
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={
        "border px-3 py-1.5 text-[12px] font-light transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (active
          ? "border-gold bg-gold/15 text-gold-dark"
          : "border-border/60 text-muted-foreground hover:border-gold/50 hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}

export function StudioMediaEditor({
  showToast,
}: {
  showToast: (message: string) => void;
}) {
  const [asset, setAsset] = React.useState<LoadedAsset | null>(null);
  const [imageAdj, setImageAdj] = React.useState<ImageAdjustments>(
    DEFAULT_IMAGE_ADJUSTMENTS
  );
  const [videoAdj, setVideoAdj] = React.useState<VideoAdjustments>(
    DEFAULT_VIDEO_ADJUSTMENTS
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const [savedUrl, setSavedUrl] = React.useState<string | null>(null);

  // פרסום תמונות
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

  const isImage = asset?.type === "image";
  const isVideo = asset?.type === "video";

  const previewUrl = React.useMemo(() => {
    if (!asset) return null;
    return buildTransformedUrl(
      asset.url,
      asset.type,
      asset.type === "image" ? imageAdj : videoAdj
    );
  }, [asset, imageAdj, videoAdj]);

  const edited = asset
    ? asset.type === "image"
      ? hasImageEdits(imageAdj)
      : hasVideoEdits(videoAdj)
    : false;

  function resetAdjustments() {
    setImageAdj(DEFAULT_IMAGE_ADJUSTMENTS);
    setVideoAdj(DEFAULT_VIDEO_ADJUSTMENTS);
    setSavedUrl(null);
  }

  function handleUploadResult(info: unknown) {
    if (
      typeof info !== "object" ||
      !info ||
      !("secure_url" in info)
    ) {
      return;
    }
    const data = info as {
      secure_url: string;
      resource_type?: string;
      duration?: number;
    };
    const type: MediaResourceType =
      data.resource_type === "video" ? "video" : "image";
    setAsset({
      url: data.secure_url,
      type,
      duration: typeof data.duration === "number" ? data.duration : null,
    });
    resetAdjustments();
    showToast(type === "video" ? "וידאו נטען לעריכה" : "תמונה נטענה לעריכה");
  }

  async function handleSave() {
    if (!asset) return;
    setBusy("save");
    try {
      const saveUrl = buildTransformedUrl(
        asset.url,
        asset.type,
        asset.type === "image" ? imageAdj : videoAdj,
        { quality: "best" }
      );
      const { url } = await saveAssetToCloudinary(saveUrl, asset.type);
      setSavedUrl(url);
      showToast("הנכס המעובד נשמר ב-Cloudinary באיכות גבוהה");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "השמירה נכשלה");
    } finally {
      setBusy(null);
    }
  }

  async function ensureSaved(): Promise<string | null> {
    if (savedUrl) return savedUrl;
    if (!asset) return null;
    const saveUrl = buildTransformedUrl(
      asset.url,
      asset.type,
      asset.type === "image" ? imageAdj : videoAdj,
      { quality: "best" }
    );
    const { url } = await saveAssetToCloudinary(saveUrl, asset.type);
    setSavedUrl(url);
    return url;
  }

  function handleDownload() {
    if (!asset) return;
    const url = buildTransformedUrl(
      asset.url,
      asset.type,
      asset.type === "image" ? imageAdj : videoAdj,
      { download: true, quality: "best" }
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = asset.type === "video"
      ? "yerushalmi-edited.mp4"
      : "yerushalmi-edited.jpg";
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  }

  async function handleCopy() {
    const url = savedUrl ?? previewUrl;
    if (!url) return;
    await navigator.clipboard.writeText(url);
    showToast("הקישור הועתק");
  }

  async function handlePublishToSite() {
    setBusy("publish");
    try {
      const url = await ensureSaved();
      if (!url) throw new Error("השמירה נכשלה");
      await publishImageToSite(publishTarget, url);
      const label =
        STUDIO_PUBLISH_TARGETS.find((t) => t.key === publishTarget)?.label ??
        "האתר";
      showToast(`פורסם בהצלחה: ${label}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "הפרסום נכשל");
    } finally {
      setBusy(null);
    }
  }

  async function handlePublishToCatalog() {
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
      const url = await ensureSaved();
      if (!url) throw new Error("השמירה נכשלה");
      const { productId } = await publishProductToCatalog({
        title: productTitle,
        description: productDescription,
        price,
        originalPrice: productOriginalPrice
          ? Number(productOriginalPrice)
          : null,
        type: productType,
        category: productCategory,
        imageUrl: url,
      });
      showToast(`המוצר נוסף למלאי (#${productId})`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "ההוספה למלאי נכשלה");
    } finally {
      setBusy(null);
    }
  }

  const selectedTarget = STUDIO_PUBLISH_TARGETS.find(
    (t) => t.key === publishTarget
  );

  return (
    <div className="space-y-8">
      {/* העלאה */}
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
            שלב 1 · העלאת חומר קיים (תמונה או וידאו)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asset ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-border/60 bg-stone-100">
                {isImage ? (
                  <Image
                    src={asset.url}
                    alt="החומר שהועלה"
                    fill
                    sizes="112px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <FileVideo
                      aria-hidden
                      className="h-10 w-10 text-muted-foreground"
                      strokeWidth={1}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-sm font-light text-emerald-800">
                  ✓ {isVideo ? "וידאו" : "תמונה"} נטען — אפשר לערוך ולמטב
                </p>
                <CldUploadWidget
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  options={{
                    maxFiles: 1,
                    multiple: false,
                    folder: "yerushalmi-studio",
                    resourceType: "auto",
                  }}
                  onSuccess={(result) => handleUploadResult(result.info)}
                >
                  {({ open }) => (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => open()}
                      className="rounded-none text-xs font-light"
                    >
                      <UploadCloud aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                      החלפת קובץ
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
                resourceType: "auto",
              }}
              onSuccess={(result) => handleUploadResult(result.info)}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  className="flex w-full flex-col items-center justify-center gap-4 border-2 border-dashed border-gold/40 bg-gold/5 py-16 transition-colors hover:border-gold/60 hover:bg-gold/10"
                >
                  <UploadCloud
                    aria-hidden
                    className="h-12 w-12 text-gold-dark"
                    strokeWidth={0.75}
                  />
                  <span className="font-serif text-xl font-light">
                    לחצו להעלאת תמונה או וידאו מהמחשב
                  </span>
                  <span className="text-xs font-light tracking-[0.1em] text-muted-foreground">
                    תמונות: JPG / PNG / WEBP · וידאו: MP4 / MOV — עריכה ומיטוב
                    ללא פגיעה במקור
                  </span>
                </button>
              )}
            </CldUploadWidget>
          )}
        </CardContent>
      </Card>

      {asset && (
        <>
          {/* כלי עריכה + תצוגה */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* בקרות */}
            <Card className="rounded-none border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                  שלב 2 · כלי מיטוב {isVideo ? "וידאו" : "תמונה"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* יחס תצוגה — משותף */}
                <div className="space-y-2">
                  <Label className="font-light">יחס / חיתוך</Label>
                  <Select
                    dir="rtl"
                    value={isImage ? imageAdj.aspect : videoAdj.aspect}
                    onValueChange={(v) =>
                      isImage
                        ? setImageAdj((a) => ({ ...a, aspect: v as AspectId }))
                        : setVideoAdj((a) => ({ ...a, aspect: v as AspectId }))
                    }
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] font-light text-muted-foreground">
                    מותאם לרשתות: ריבוע לפוסט, 9:16 לסטורי/ריל, 16:9 לרוחב.
                  </p>
                </div>

                <Separator className="bg-border/40" />

                {isImage && (
                  <>
                    <div className="space-y-2">
                      <Label className="font-light">פריסטים מהירים</Label>
                      <div className="flex flex-wrap gap-2">
                        <ToggleChip
                          label="קטלוג יהלומים"
                          active={
                            imageAdj.aspect === "1:1" &&
                            imageAdj.autoEnhance &&
                            imageAdj.sharpen
                          }
                          onClick={() =>
                            setImageAdj(JEWELRY_CATALOG_IMAGE_ADJUSTMENTS)
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-light">שיפורים אוטומטיים</Label>
                      <div className="flex flex-wrap gap-2">
                        <ToggleChip
                          label="שיפור אוטומטי"
                          active={imageAdj.autoEnhance}
                          onClick={() =>
                            setImageAdj((a) => ({
                              ...a,
                              autoEnhance: !a.autoEnhance,
                            }))
                          }
                        />
                        <ToggleChip
                          label="איזון צבע"
                          active={imageAdj.autoColor}
                          onClick={() =>
                            setImageAdj((a) => ({
                              ...a,
                              autoColor: !a.autoColor,
                            }))
                          }
                        />
                        <ToggleChip
                          label="חידוד"
                          active={imageAdj.sharpen}
                          onClick={() =>
                            setImageAdj((a) => ({ ...a, sharpen: !a.sharpen }))
                          }
                        />
                        <ToggleChip
                          label="הגדלת רזולוציה"
                          active={imageAdj.upscale}
                          disabled={imageAdj.aspect !== "original"}
                          onClick={() =>
                            setImageAdj((a) => ({ ...a, upscale: !a.upscale }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <AdjustSlider
                        label="בהירות"
                        value={imageAdj.brightness}
                        onChange={(v) =>
                          setImageAdj((a) => ({ ...a, brightness: v }))
                        }
                      />
                      <AdjustSlider
                        label="רוויה"
                        value={imageAdj.saturation}
                        onChange={(v) =>
                          setImageAdj((a) => ({ ...a, saturation: v }))
                        }
                      />
                      <AdjustSlider
                        label="ניגודיות"
                        value={imageAdj.contrast}
                        onChange={(v) =>
                          setImageAdj((a) => ({ ...a, contrast: v }))
                        }
                      />
                    </div>
                  </>
                )}

                {isVideo && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-light text-muted-foreground">
                          חיתוך — נקודת התחלה (שניות)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={videoAdj.trimStart ?? ""}
                          onChange={(e) =>
                            setVideoAdj((a) => ({
                              ...a,
                              trimStart: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }))
                          }
                          placeholder="0"
                          className="rounded-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-light text-muted-foreground">
                          נקודת סיום (שניות)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={videoAdj.trimEnd ?? ""}
                          onChange={(e) =>
                            setVideoAdj((a) => ({
                              ...a,
                              trimEnd: e.target.value
                                ? Number(e.target.value)
                                : null,
                            }))
                          }
                          placeholder={
                            asset.duration
                              ? asset.duration.toFixed(1)
                              : "סיום"
                          }
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    {asset.duration != null && (
                      <p className="text-[11px] font-light text-muted-foreground">
                        אורך הווידאו: {asset.duration.toFixed(1)} שניות
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <ToggleChip
                        label="השתקת אודיו"
                        active={videoAdj.mute}
                        onClick={() =>
                          setVideoAdj((a) => ({ ...a, mute: !a.mute }))
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      <AdjustSlider
                        label="בהירות"
                        value={videoAdj.brightness}
                        onChange={(v) =>
                          setVideoAdj((a) => ({ ...a, brightness: v }))
                        }
                      />
                      <AdjustSlider
                        label="רוויה"
                        value={videoAdj.saturation}
                        onChange={(v) =>
                          setVideoAdj((a) => ({ ...a, saturation: v }))
                        }
                      />
                    </div>
                  </>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetAdjustments}
                  disabled={!edited}
                  className="rounded-none text-xs font-light text-muted-foreground"
                >
                  <RotateCcw aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                  איפוס שינויים
                </Button>
              </CardContent>
            </Card>

            {/* תצוגה חיה */}
            <Card className="rounded-none border-border/60 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                  תצוגה חיה {edited ? "· נערך" : "· מקור"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative flex aspect-square max-h-[420px] w-full items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200">
                  {isImage && previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={previewUrl}
                      src={previewUrl}
                      alt="תצוגה מקדימה של החומר המעובד"
                      className="h-full w-full object-contain"
                    />
                  )}
                  {isVideo && previewUrl && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video
                      key={previewUrl}
                      src={previewUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    disabled={busy !== null}
                    onClick={handleSave}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    {busy === "save" ? (
                      <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    )}
                    שמירה ב-Cloudinary
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    {isVideo ? (
                      <Download aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    ) : (
                      <ImageDown aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    )}
                    הורדה למחשב
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="rounded-none text-xs font-light tracking-[0.1em]"
                  >
                    <Copy aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    העתקת קישור
                  </Button>
                </div>

                {savedUrl && (
                  <p className="text-[11px] font-light text-emerald-700">
                    ✓ נשמר ב-Cloudinary — מוכן לפרסום
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* פרסום תמונות בלבד */}
          {isImage && (
            <Card className="rounded-none border-gold/30 bg-gold/5 shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-light tracking-[0.1em] text-gold-dark">
                  <Sparkles aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  שלב 3 · פרסום התמונה המעובדת
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* פרסום כבאנר */}
                <div className="space-y-3">
                  <Label className="font-light">פרסום כתמונה באתר</Label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Select
                      dir="rtl"
                      value={publishTarget}
                      onValueChange={(v) => setPublishTarget(v as SettingKey)}
                    >
                      <SelectTrigger className="rounded-none bg-background sm:max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STUDIO_PUBLISH_TARGETS.map((t) => (
                          <SelectItem key={t.key} value={t.key}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={busy !== null}
                      onClick={handlePublishToSite}
                      className="rounded-none text-xs font-light tracking-[0.15em]"
                    >
                      {busy === "publish" ? (
                        <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Globe aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                      )}
                      פרסום באתר
                    </Button>
                  </div>
                  {selectedTarget && (
                    <Link
                      href={selectedTarget.previewPath}
                      target="_blank"
                      className="inline-flex items-center text-[11px] font-light text-gold-dark hover:underline"
                    >
                      <Globe aria-hidden className="ml-1 h-3 w-3" />
                      תצוגה מקדימה ביעד
                    </Link>
                  )}
                </div>

                <Separator className="bg-gold/20" />

                {/* הוספה למלאי */}
                <div className="space-y-4">
                  <Label className="font-light">הוספה כמוצר חדש למלאי</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="me-title" className="text-xs font-light text-muted-foreground">
                        שם המוצר *
                      </Label>
                      <Input
                        id="me-title"
                        value={productTitle}
                        onChange={(e) => setProductTitle(e.target.value)}
                        placeholder="לדוגמה: טבעת סוליטר 1.5 קראט"
                        className="rounded-none bg-background"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="me-desc" className="text-xs font-light text-muted-foreground">
                        תיאור (אופציונלי)
                      </Label>
                      <Textarea
                        id="me-desc"
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={2}
                        className="rounded-none resize-none bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="me-price" className="text-xs font-light text-muted-foreground">
                        מחיר (₪) *
                      </Label>
                      <Input
                        id="me-price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        placeholder="0.00"
                        className="rounded-none bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="me-original" className="text-xs font-light text-muted-foreground">
                        מחיר לפני הנחה
                      </Label>
                      <Input
                        id="me-original"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productOriginalPrice}
                        onChange={(e) => setProductOriginalPrice(e.target.value)}
                        placeholder="אופציונלי"
                        className="rounded-none bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-light text-muted-foreground">
                        סוג יהלום *
                      </Label>
                      <Select
                        dir="rtl"
                        value={productType}
                        onValueChange={(v) =>
                          setProductType(
                            v as (typeof PRODUCT_TYPES)[number]["value"]
                          )
                        }
                      >
                        <SelectTrigger className="rounded-none bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-light text-muted-foreground">
                        קטגוריה *
                      </Label>
                      <Select
                        dir="rtl"
                        value={productCategory}
                        onValueChange={(v) =>
                          setProductCategory(
                            v as (typeof PRODUCT_CATEGORIES)[number]["value"]
                          )
                        }
                      >
                        <SelectTrigger className="rounded-none bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRODUCT_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    disabled={busy !== null}
                    onClick={handlePublishToCatalog}
                    className="rounded-none text-xs font-light tracking-[0.15em]"
                  >
                    {busy === "catalog" ? (
                      <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PackagePlus aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    )}
                    הוספה למלאי
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isVideo && (
            <Card className="rounded-none border-border/60 shadow-none">
              <CardContent className="py-4 text-center text-xs font-light text-muted-foreground">
                <Wand2 aria-hidden className="ml-1 inline h-3.5 w-3.5" />
                שמרו את הווידאו ב-Cloudinary והורידו אותו לשימוש ברשתות החברתיות
                ובפרסום.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
