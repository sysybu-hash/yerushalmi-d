"use client";

import { ImageUp, Sparkles } from "lucide-react";

import { AdjustSlider, ToggleChip } from "@/components/studio/studio-adjust-ui";
import type { SourceEnhancePreset } from "@/lib/studio-api";
import {
  buildTransformedUrl,
  hasImageEdits,
  type ImageAdjustments,
} from "@/lib/studio-transform";
import { Button } from "@/components/ui/button";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";
import { StudioSection } from "./studio-section";

const AI_PRESETS: { id: SourceEnhancePreset; label: string; hint: string }[] = [
  { id: "complete", label: "השלמת שרשרת", hint: "משלים חלקים חתוכים בקצוות" },
  { id: "cleanup", label: "רקע לבן נקי", hint: "מנקה רקע וצללים לצילום קטלוגי" },
  { id: "enhance", label: "שיפור חדות ותאורה", hint: "חידוד ותאורת סטודיו" },
];

/** עריכת צילום המקור — תמיד גלוי */
export function StudioSourceSection({
  sourceUrl,
  activeImageLabel,
  adjustments,
  onAdjustmentsChange,
  onSourceReplaced,
  onAiEnhance,
  disabled,
}: {
  sourceUrl: string;
  activeImageLabel?: string;
  adjustments: ImageAdjustments;
  onAdjustmentsChange: (next: ImageAdjustments) => void;
  onSourceReplaced: (url: string, label: string) => void;
  onAiEnhance: (preset: SourceEnhancePreset) => void;
  disabled?: boolean;
}) {
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
    <StudioSection title="עריכת צילום המקור">
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-light text-muted-foreground">
              <ImageUp className="h-3 w-3" />
              התאמות מהירות (Cloudinary)
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

        <div className="space-y-2 border-t border-border/40 pt-3">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-light text-muted-foreground">
              <Sparkles className="h-3 w-3 text-gold-dark" />
              שיפור AI (Gemini)
            </p>
            <StudioCostChip label={STUDIO_COST_LABELS.sourceEnhance} />
          </div>
          {activeImageLabel && (
            <p className="text-[10px] font-light text-muted-foreground">
              יחול על: {activeImageLabel}
            </p>
          )}
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
    </StudioSection>
  );
}
