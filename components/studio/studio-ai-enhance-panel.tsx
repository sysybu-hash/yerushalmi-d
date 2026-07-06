"use client";

import * as React from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StudioPipelineMode } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";
import {
  humanizeStudioError,
  studioApiEnhanceSource,
  studioApiEnhanceVideo,
  type SourceEnhancePreset,
  type VideoEnhancePreset,
  type VideoEnhanceProvider,
} from "@/lib/studio-api";
import { ToggleChip } from "@/components/studio/studio-adjust-ui";

const IMAGE_PRESETS: {
  id: SourceEnhancePreset;
  label: string;
  hint: string;
}[] = [
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

const VIDEO_PRESETS: {
  id: VideoEnhancePreset;
  label: string;
  hint: string;
}[] = [
  {
    id: "catalog",
    label: "קטלוג תכשיטים",
    hint: "שיפור, צבע, חדות ויחס 1:1",
  },
  {
    id: "stabilize",
    label: "ייצוב ורעש",
    hint: "החלקת רעידות והפחתת רעש",
  },
  {
    id: "sharpen",
    label: "חידוד",
    hint: "חדות גבוהה לפרטי התכשיט",
  },
  {
    id: "color",
    label: "איזון צבע",
    hint: "תאורה וצבעים טבעיים",
  },
];

const VIDEO_PROVIDER_OPTIONS: {
  id: VideoEnhanceProvider;
  label: string;
  hint: string;
}[] = [
  {
    id: "cloudinary",
    label: "Cloudinary",
    hint: "מהיר, ללא מכסת וידאו AI — שיפור צבע וחדות",
  },
  {
    id: "gemini",
    label: "Gemini (Veo)",
    hint: "משתמש במכסת תמונות AI — מתאים כשמכסת הווידאו נגמרה",
  },
];

type StudioAiEnhancePanelProps = {
  mediaType: "image" | "video";
  sourceUrl: string;
  onEnhanced: (url: string) => void;
  showToast: (message: string) => void;
  studioMode?: StudioPipelineMode;
  projectId?: number | null;
  disabled?: boolean;
  videoDuration?: StudioVideoDurationSec;
  stylePreset?: StudioStylePresetId;
};

export function StudioAiEnhancePanel({
  mediaType,
  sourceUrl,
  onEnhanced,
  showToast,
  studioMode = "catalog",
  projectId,
  disabled,
  videoDuration = 5,
  stylePreset = "luxury-marble",
}: StudioAiEnhancePanelProps) {
  const [busy, setBusy] = React.useState(false);
  const [imagePreset, setImagePreset] =
    React.useState<SourceEnhancePreset>("enhance");
  const [videoPreset, setVideoPreset] =
    React.useState<VideoEnhancePreset>("catalog");
  const [videoProvider, setVideoProvider] =
    React.useState<VideoEnhanceProvider>("cloudinary");
  const [customPrompt, setCustomPrompt] = React.useState("");

  const presets = mediaType === "image" ? IMAGE_PRESETS : VIDEO_PRESETS;
  const activePreset = mediaType === "image" ? imagePreset : videoPreset;
  const activeProviderHint = VIDEO_PROVIDER_OPTIONS.find(
    (p) => p.id === videoProvider
  )?.hint;

  async function handleEnhance() {
    setBusy(true);
    try {
      if (mediaType === "image") {
        const result = await studioApiEnhanceSource(sourceUrl, {
          preset: imagePreset,
          customPrompt: customPrompt || undefined,
          mode: studioMode,
          projectId: projectId ?? undefined,
        });
        if (!result.ok) {
          showToast(humanizeStudioError(result.error));
          return;
        }
        onEnhanced(result.data.url);
        showToast("התמונה שופרה ב-AI — בדקו לפני שמירה");
        return;
      }

      const result = await studioApiEnhanceVideo(sourceUrl, {
        preset: videoPreset,
        provider: videoProvider,
        customPrompt: customPrompt || undefined,
        duration: videoDuration,
        stylePreset,
        mode: studioMode,
        projectId: projectId ?? undefined,
      });
      if (!result.ok) {
        showToast(humanizeStudioError(result.error));
        return;
      }
      onEnhanced(result.data.url);
      showToast(
        videoProvider === "gemini"
          ? "הווידאו שופר ב-Gemini — בדקו לפני שמירה"
          : "הווידאו שופר — בדקו לפני שמירה"
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "המיטוב ב-AI נכשל");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-none border border-gold/25 bg-gold/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="h-4 w-4 text-gold-dark" strokeWidth={1.5} />
        <Label className="font-light">
          מיטוב AI —{" "}
          {mediaType === "image"
            ? "תמונה (Gemini)"
            : videoProvider === "gemini"
              ? "וידאו (Gemini Veo)"
              : "וידאו (Cloudinary)"}
        </Label>
      </div>
      <p className="text-[11px] font-light text-muted-foreground">
        {mediaType === "image"
          ? "משלים חלקים, מנקה רקע, או משפר חדות — נספר במכסת תמונות AI."
          : videoProvider === "gemini"
            ? "משפר פריים מרכזי ב-Gemini ויוצר קליפ קצר ב-Veo — נספר במכסת תמונות AI, לא במכסת וידאו יומית."
            : "ייצוב, חידוד וצבע אוטומטיים — ללא מכסת וידאו AI."}
      </p>

      {mediaType === "video" && (
        <div className="space-y-2">
          <Label className="text-xs font-light text-muted-foreground">
            מנוע מיטוב
          </Label>
          <div className="flex flex-wrap gap-2">
            {VIDEO_PROVIDER_OPTIONS.map((option) => (
              <ToggleChip
                key={option.id}
                label={option.label}
                active={videoProvider === option.id}
                disabled={disabled || busy}
                onClick={() => setVideoProvider(option.id)}
              />
            ))}
          </div>
          {activeProviderHint && (
            <p className="text-[10px] font-light text-muted-foreground">
              {activeProviderHint}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <ToggleChip
            key={preset.id}
            label={preset.label}
            active={activePreset === preset.id}
            disabled={disabled || busy}
            onClick={() => {
              if (mediaType === "image") {
                setImagePreset(preset.id as SourceEnhancePreset);
              } else {
                setVideoPreset(preset.id as VideoEnhancePreset);
              }
            }}
          />
        ))}
      </div>
      <p className="text-[10px] font-light text-muted-foreground">
        {presets.find((p) => p.id === activePreset)?.hint}
      </p>

      {(mediaType === "image" ||
        (mediaType === "video" && videoProvider === "gemini")) && (
        <Textarea
          dir="rtl"
          placeholder="הוראות נוספות (אופציונלי)"
          value={customPrompt}
          disabled={disabled || busy}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="min-h-[64px] rounded-none text-sm font-light"
        />
      )}

      <Button
        type="button"
        disabled={disabled || busy}
        onClick={() => void handleEnhance()}
        className="rounded-none text-xs font-light tracking-[0.1em]"
      >
        {busy ? (
          <Loader2 aria-hidden className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles aria-hidden className="ml-2 h-4 w-4" strokeWidth={1.5} />
        )}
        {mediaType === "image"
          ? "החל מיטוב AI על התמונה"
          : videoProvider === "gemini"
            ? "החל מיטוב Gemini על הווידאו"
            : "החל מיטוב AI על הווידאו"}
      </Button>
    </div>
  );
}
