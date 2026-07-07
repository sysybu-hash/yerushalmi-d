"use client";

import * as React from "react";
import { ChevronDown, ImageUp, Sparkles } from "lucide-react";

import { AdjustSlider, ToggleChip } from "@/components/studio/studio-adjust-ui";
import type { SourceEnhancePreset } from "@/lib/studio-api";
import {
  buildTransformedUrl,
  hasImageEdits,
  type ImageAdjustments,
} from "@/lib/studio-transform";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";

const AI_PRESETS: { id: SourceEnhancePreset; label: string; hint: string }[] = [
  { id: "complete", label: "השלמת שרשרת", hint: "משלים חלקים חתוכים בקצוות" },
  { id: "cleanup", label: "רקע לבן נקי", hint: "מנקה רקע וצללים לצילום קטלוגי" },
  { id: "enhance", label: "שיפור חדות ותאורה", hint: "חידוד ותאורת סטודיו" },
];

/**
 * עריכת צילום המקור לפני יצירה:
 * התאמות Cloudinary (חינם) + שלושה פריסטים של שיפור AI.
 */
export function StudioSourceTools({
  sourceUrl,
  adjustments,
  onAdjustmentsChange,
  onSourceReplaced,
  onAiEnhance,
  disabled,
}: {
  sourceUrl: string;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (next: ImageAdjustments) => void;
  onSourceReplaced: (url: string, label: string) => void;
  onAiEnhance: (preset: SourceEnhancePreset) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  function patch(partial: Partial<ImageAdjustments>) {
    onAdjustmentsChange({ ...adjustments, ...partial });
  }

  function applyFreeEdits() {
    const url = buildTransformedUrl(sourceUrl, "image", adjustments, {
      quality: "best",
    });
    onSourceReplaced(url, "מקור ערוך");
  }

  return (
    <div className="border border-border/60">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-light tracking-[0.1em] text-muted-foreground hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <ImageUp className="h-3.5 w-3.5" />
          שיפור צילום המקור
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-border/60 p-3">
          {/* התאמות חינמיות */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-light text-muted-foreground">
                התאמות מהירות
              </p>
              <StudioCostChip free />
            </div>
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
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || !hasImageEdits(adjustments)}
              onClick={applyFreeEdits}
              className="w-full rounded-none text-xs font-light"
            >
              החלת ההתאמות על המקור (חינם)
            </Button>
          </div>

          {/* שיפור AI */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-light text-muted-foreground">
                <Sparkles className="h-3 w-3 text-gold-dark" />
                שיפור AI (Gemini)
              </p>
              <StudioCostChip label={STUDIO_COST_LABELS.sourceEnhance} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {AI_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={disabled}
                  title={preset.hint}
                  onClick={() => onAiEnhance(preset.id)}
                  className="border border-border/60 px-2 py-2 text-[11px] font-light transition-colors hover:border-gold/50 disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
