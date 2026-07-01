"use client";

import * as React from "react";
import { Loader2, RotateCcw, Sparkles, Wand2 } from "lucide-react";

import { saveAssetToCloudinary } from "@/app/(ai-studio)/studio/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MediaPreviewTrigger } from "@/components/ui/media-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { StudioPipelineMode } from "@/lib/ai-engines";
import {
  humanizeStudioError,
  studioApiEnhanceSource,
  type SourceEnhancePreset,
} from "@/lib/studio-api";
import {
  ASPECT_OPTIONS,
  DEFAULT_IMAGE_ADJUSTMENTS,
  JEWELRY_CATALOG_IMAGE_ADJUSTMENTS,
  buildTransformedUrl,
  hasImageEdits,
  type AspectId,
  type ImageAdjustments,
} from "@/lib/studio-transform";

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

const AI_PRESETS: { id: SourceEnhancePreset; label: string; hint: string }[] =
  [
    {
      id: "complete",
      label: "השלמת שרשרת / חלקים חתוכים",
      hint: "מרחיב אזורים חסרים בלי לשנות את התכשיט",
    },
    {
      id: "cleanup",
      label: "רקע לבן נקי",
      hint: "מנקה רקע וצללים לצילום קטלוג",
    },
    {
      id: "enhance",
      label: "שיפור חדות ותאורה",
      hint: "חידוד ותאורת סטודיו — אותו עיצוב",
    },
  ];

type StudioSourcePrepProps = {
  sourceUrl: string;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (adj: ImageAdjustments) => void;
  onSourceUpdated: (url: string) => void;
  showToast: (message: string) => void;
  studioMode: StudioPipelineMode;
  projectId?: number | null;
  disabled?: boolean;
};

export function StudioSourcePrep({
  sourceUrl,
  adjustments,
  onAdjustmentsChange,
  onSourceUpdated,
  showToast,
  studioMode,
  projectId,
  disabled,
}: StudioSourcePrepProps) {
  const [busy, setBusy] = React.useState<"cloudinary" | "ai" | null>(null);
  const [aiPreset, setAiPreset] =
    React.useState<SourceEnhancePreset>("complete");
  const [aiPrompt, setAiPrompt] = React.useState("");

  const previewUrl = React.useMemo(
    () => buildTransformedUrl(sourceUrl, "image", adjustments, { quality: "best" }),
    [sourceUrl, adjustments]
  );

  const edited = hasImageEdits(adjustments);

  function patchAdj(patch: Partial<ImageAdjustments>) {
    onAdjustmentsChange({ ...adjustments, ...patch });
  }

  function resetAdjustments() {
    onAdjustmentsChange(DEFAULT_IMAGE_ADJUSTMENTS);
  }

  async function handleApplyCloudinary() {
    setBusy("cloudinary");
    try {
      const saveUrl = buildTransformedUrl(sourceUrl, "image", adjustments, {
        quality: "best",
      });
      const { url } = await saveAssetToCloudinary(saveUrl, "image");
      onSourceUpdated(url);
      onAdjustmentsChange(DEFAULT_IMAGE_ADJUSTMENTS);
      showToast("המיטוב נשמר — ממשיכים עם התמונה המעובדת");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "שמירת המיטוב נכשלה");
    } finally {
      setBusy(null);
    }
  }

  async function handleAiEnhance() {
    setBusy("ai");
    try {
      const result = await studioApiEnhanceSource(sourceUrl, {
        preset: aiPreset,
        customPrompt: aiPrompt || undefined,
        mode: studioMode,
        projectId: projectId ?? undefined,
      });
      if (!result.ok) {
        showToast(humanizeStudioError(result.error));
        return;
      }
      onSourceUpdated(result.data.url);
      onAdjustmentsChange(DEFAULT_IMAGE_ADJUSTMENTS);
      showToast("התמונה הושלמה ב-AI — בדקו את התוצאה לפני המשך");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "השלמת התמונה נכשלה");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="rounded-none border-gold/25 bg-gold/[0.03] shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-light tracking-[0.1em] text-gold-dark">
          <Wand2 aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          מיטוב הצילום לפני יצירה
        </CardTitle>
        <p className="text-[11px] font-light text-muted-foreground">
          אופציונלי — שפרו את הצילום הגולמי לפני cutout ורקע. מיטוב Cloudinary
          מהיר; השלמה ב-AI לשרשראות חתוכות או רקע לא אחיד.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-light">יחס / חיתוך</Label>
              <Select
                dir="rtl"
                value={adjustments.aspect}
                onValueChange={(v) =>
                  patchAdj({ aspect: v as AspectId })
                }
                disabled={disabled || busy !== null}
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
            </div>

            <div className="space-y-2">
              <Label className="font-light">פריסטים מהירים</Label>
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  label="קטלוג יהלומים"
                  active={
                    adjustments.aspect === "1:1" &&
                    adjustments.autoEnhance &&
                    adjustments.sharpen
                  }
                  disabled={disabled || busy !== null}
                  onClick={() =>
                    onAdjustmentsChange(JEWELRY_CATALOG_IMAGE_ADJUSTMENTS)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-light">שיפורים אוטומטיים</Label>
              <div className="flex flex-wrap gap-2">
                <ToggleChip
                  label="שיפור אוטומטי"
                  active={adjustments.autoEnhance}
                  disabled={disabled || busy !== null}
                  onClick={() =>
                    patchAdj({ autoEnhance: !adjustments.autoEnhance })
                  }
                />
                <ToggleChip
                  label="איזון צבע"
                  active={adjustments.autoColor}
                  disabled={disabled || busy !== null}
                  onClick={() =>
                    patchAdj({ autoColor: !adjustments.autoColor })
                  }
                />
                <ToggleChip
                  label="חידוד"
                  active={adjustments.sharpen}
                  disabled={disabled || busy !== null}
                  onClick={() => patchAdj({ sharpen: !adjustments.sharpen })}
                />
                <ToggleChip
                  label="הגדלת רזולוציה"
                  active={adjustments.upscale}
                  disabled={
                    disabled || busy !== null || adjustments.aspect !== "original"
                  }
                  onClick={() => patchAdj({ upscale: !adjustments.upscale })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <AdjustSlider
                label="בהירות"
                value={adjustments.brightness}
                disabled={disabled || busy !== null}
                onChange={(v) => patchAdj({ brightness: v })}
              />
              <AdjustSlider
                label="רוויה"
                value={adjustments.saturation}
                disabled={disabled || busy !== null}
                onChange={(v) => patchAdj({ saturation: v })}
              />
              <AdjustSlider
                label="ניגודיות"
                value={adjustments.contrast}
                disabled={disabled || busy !== null}
                onChange={(v) => patchAdj({ contrast: v })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={disabled || busy !== null || !edited}
                onClick={() => void handleApplyCloudinary()}
                className="rounded-none text-xs font-light"
              >
                {busy === "cloudinary" ? (
                  <Loader2 aria-hidden className="ml-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                החלת מיטוב (Cloudinary)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || busy !== null || !edited}
                onClick={resetAdjustments}
                className="rounded-none text-xs font-light text-muted-foreground"
              >
                <RotateCcw aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                איפוס
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-light">תצוגה מקדימה {edited ? "· נערך" : ""}</Label>
            <div className="relative aspect-square overflow-hidden border border-border/60 bg-stone-100">
              {previewUrl && (
                <MediaPreviewTrigger
                  url={previewUrl}
                  type="image"
                  alt="תצוגה מקדימה של הצילום לפני יצירה"
                  className="absolute inset-0 block h-full w-full"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={previewUrl}
                    src={previewUrl}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </MediaPreviewTrigger>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles aria-hidden className="h-4 w-4 text-gold-dark" strokeWidth={1.5} />
            <Label className="font-light">השלמה ב-AI (Gemini)</Label>
          </div>
          <p className="text-[11px] font-light text-muted-foreground">
            שומר על אותו תכשיט — משלים שרשרת, מנקה רקע, או משפר חדות. ספירה
            במכסת תמונות AI היומית.
          </p>

          <div className="flex flex-wrap gap-2">
            {AI_PRESETS.map((preset) => (
              <ToggleChip
                key={preset.id}
                label={preset.label}
                active={aiPreset === preset.id}
                disabled={disabled || busy !== null}
                onClick={() => setAiPreset(preset.id)}
              />
            ))}
          </div>
          <p className="text-[10px] font-light text-muted-foreground">
            {AI_PRESETS.find((p) => p.id === aiPreset)?.hint}
          </p>

          <Textarea
            dir="rtl"
            placeholder="הוראות נוספות (אופציונלי) — לדוגמה: השלימו את השרשרת בצד ימין"
            value={aiPrompt}
            disabled={disabled || busy !== null}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="min-h-[72px] rounded-none text-sm font-light"
          />

          <Button
            type="button"
            disabled={disabled || busy !== null}
            onClick={() => void handleAiEnhance()}
            className="rounded-none text-xs font-light tracking-[0.1em]"
          >
            {busy === "ai" ? (
              <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
            )}
            השלמת תמונה ב-AI
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
