"use client";

import type { StudioVideoMotionMode } from "@/lib/studio-types";
import {
  STUDIO_VIDEO_DURATION_OPTIONS,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";

/** אפשרויות וידאו מינימליות — משך + סוג תנועה. השאר בהגדרות מתקדמות */
export function StudioVideoOptions({
  duration,
  motion,
  onDurationChange,
  onMotionChange,
  disabled,
}: {
  duration: StudioVideoDurationSec;
  motion: StudioVideoMotionMode;
  onDurationChange: (value: StudioVideoDurationSec) => void;
  onMotionChange: (value: StudioVideoMotionMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
          סוג תנועה
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMotionChange("preserve")}
            className={cn(
              "flex flex-col items-center gap-1 border px-2 py-2 text-xs font-light transition-colors disabled:opacity-50",
              motion === "preserve"
                ? "border-gold bg-gold/10"
                : "border-border/60 hover:border-gold/40"
            )}
          >
            <span>זום עדין (מומלץ)</span>
            <StudioCostChip free />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onMotionChange("ai")}
            className={cn(
              "flex flex-col items-center gap-1 border px-2 py-2 text-xs font-light transition-colors disabled:opacity-50",
              motion === "ai"
                ? "border-gold bg-gold/10"
                : "border-border/60 hover:border-gold/40"
            )}
          >
            <span>תנועת AI קולנועית</span>
            <StudioCostChip label={STUDIO_COST_LABELS.aiVideo} />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
          משך (שניות)
        </p>
        <div className="flex gap-2">
          {STUDIO_VIDEO_DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              title={option.hint}
              onClick={() => onDurationChange(option.value)}
              className={cn(
                "flex-1 border px-2 py-1.5 text-xs font-light transition-colors disabled:opacity-50",
                duration === option.value
                  ? "border-gold bg-gold/10"
                  : "border-border/60 hover:border-gold/40"
              )}
            >
              {option.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
