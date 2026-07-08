"use client";

import * as React from "react";
import { ChevronDown, Film, Loader2 } from "lucide-react";

import { ensureStudioAudioTrack } from "@/app/(ai-studio)/studio/actions";
import { AdjustSlider, ToggleChip } from "@/components/studio/studio-adjust-ui";
import { StudioVideoAudioPanel } from "@/components/studio/studio-video-audio-panel";
import {
  ASPECT_OPTIONS,
  buildTransformedUrl,
  hasVideoEdits,
  type VideoAdjustments,
} from "@/lib/studio-transform";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";
import { Sparkles } from "lucide-react";

/**
 * ליטוש וידאו (תוצאה או וידאו שהועלה): מוזיקה, יחס גובה-רוחב
 * והתאמות תמונה — הכול דרך Cloudinary, בלי עלות AI.
 */
export function StudioVideoTools({
  videoUrl,
  adjustments,
  onAdjustmentsChange,
  onApplied,
  onRequestEnhanceAi,
  disabled,
}: {
  videoUrl: string;
  adjustments: VideoAdjustments;
  onAdjustmentsChange: (next: VideoAdjustments) => void;
  /** מחזיר את ה-URL הערוך — נוסף לגלריה והופך לתוצאה */
  onApplied: (url: string, label: string) => void;
  /** מבקש אישור להרצת שיפור AI (Veo) בתשלום — הדיאלוג עצמו ב-page.tsx */
  onRequestEnhanceAi?: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(true);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function patch(partial: Partial<VideoAdjustments>) {
    onAdjustmentsChange({ ...adjustments, ...partial });
  }

  async function applyEdits() {
    setError(null);
    setApplying(true);
    try {
      // מוזיקת רקע (לא none/original) חייבת קודם קיום ב-Cloudinary —
      // בפעם הראשונה זה מעלה אותה מ-Mixkit (עד כ-30 שנ'), אחר כך מיידי.
      let audioPublicId: string | undefined;
      if (
        !adjustments.mute &&
        adjustments.audioStyle !== "none" &&
        adjustments.audioStyle !== "original"
      ) {
        const ensured = await ensureStudioAudioTrack(adjustments.audioStyle);
        if (!ensured.ok) {
          setError(ensured.error);
          return;
        }
        audioPublicId = ensured.data.publicId ?? undefined;
      }

      const url = buildTransformedUrl(videoUrl, "video", adjustments, {
        quality: "best",
        audioPublicId,
      });

      // בדיקת תקינות לפני שהתוצאה נכנסת לגלריה — עדיף שגיאה ברורה כאן
      // מאשר וידאו שבור שרק מתגלה בנגן
      const check = await fetch(url, { method: "HEAD" });
      if (!check.ok) {
        setError("בניית הווידאו נכשלה — נסו סגנון מוזיקה אחר או ללא מוזיקה");
        return;
      }

      onApplied(url, "וידאו ערוך");
    } catch {
      setError("הליטוש נכשל — נסו שוב");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="border border-border/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-light tracking-[0.1em] text-muted-foreground hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <Film className="h-3.5 w-3.5" />
          ליטוש הווידאו — מוזיקה, פורמט וצבע
        </span>
        <span className="flex items-center gap-2">
          <StudioCostChip free />
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-3">
          <div className="space-y-1.5">
            <p className="text-xs font-light text-muted-foreground">
              יחס גובה-רוחב
            </p>
            <div className="flex flex-wrap gap-2">
              {ASPECT_OPTIONS.map((option) => (
                <ToggleChip
                  key={option.id}
                  label={option.label}
                  active={adjustments.aspect === option.id}
                  disabled={disabled}
                  onClick={() => patch({ aspect: option.id })}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-light text-muted-foreground">
              שיפורי תמונה
            </p>
            <div className="flex flex-wrap gap-2">
              <ToggleChip
                label="שיפור אוטומטי"
                active={adjustments.autoEnhance}
                disabled={disabled}
                onClick={() => patch({ autoEnhance: !adjustments.autoEnhance })}
              />
              <ToggleChip
                label="איזון צבע"
                active={adjustments.autoColor}
                disabled={disabled}
                onClick={() => patch({ autoColor: !adjustments.autoColor })}
              />
              <ToggleChip
                label="חידוד"
                active={adjustments.sharpen}
                disabled={disabled}
                onClick={() => patch({ sharpen: !adjustments.sharpen })}
              />
              <ToggleChip
                label="הפחתת רעש"
                active={adjustments.denoise}
                disabled={disabled}
                onClick={() => patch({ denoise: !adjustments.denoise })}
              />
            </div>
            <AdjustSlider
              label="בהירות"
              value={adjustments.brightness}
              disabled={disabled}
              onChange={(v) => patch({ brightness: v })}
            />
            <AdjustSlider
              label="רוויה"
              value={adjustments.saturation}
              disabled={disabled}
              onChange={(v) => patch({ saturation: v })}
            />
            <AdjustSlider
              label="ניגודיות"
              value={adjustments.contrast}
              disabled={disabled}
              onChange={(v) => patch({ contrast: v })}
            />
          </div>

          <StudioVideoAudioPanel
            adjustments={adjustments}
            onChange={onAdjustmentsChange}
            disabled={disabled}
          />

          <Button
            size="sm"
            disabled={disabled || applying || !hasVideoEdits(adjustments)}
            onClick={() => void applyEdits()}
            className="w-full rounded-none bg-gold text-xs font-light text-black hover:bg-gold/90"
          >
            {applying ? (
              <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            החלת הליטוש (חינם) — נשמר בגלריה
          </Button>
          {error && (
            <p className="text-[11px] font-light text-red-600">{error}</p>
          )}

          {onRequestEnhanceAi && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-xs font-light text-muted-foreground">
                או: שיפור תאורה ותנועה ב-AI (Veo) — בתשלום
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={onRequestEnhanceAi}
                className="w-full rounded-none border-gold/40 text-xs font-light text-gold-dark hover:bg-gold/10"
              >
                <Sparkles className="ml-1.5 h-3.5 w-3.5" />
                שיפור וידאו ב-AI
                <span className="mr-auto">
                  <StudioCostChip label={STUDIO_COST_LABELS.videoEnhanceAi} />
                </span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
