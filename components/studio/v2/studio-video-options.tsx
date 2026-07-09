"use client";

import type { StudioVideoMotionMode } from "@/lib/studio-types";
import {
  MULTISHOT_TEMPLATES,
  type MultiShotTemplateId,
} from "@/lib/studio-multishot";
import {
  STUDIO_VIDEO_DURATION_OPTIONS,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import { cn } from "@/lib/utils";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";
import { StudioSection } from "./studio-section";

/** אפשרויות וידאו — משך, תנועה, מולטי-שוט. מנוע הווידאו בסקשן "מנועי AI" */
export function StudioVideoOptions({
  duration,
  motion,
  videoEngine,
  nativeAudio,
  multiShot,
  onDurationChange,
  onMotionChange,
  onNativeAudioChange,
  onMultiShotChange,
  disabled,
}: {
  duration: StudioVideoDurationSec;
  motion: StudioVideoMotionMode;
  /** לתנאי Kling — מגיע מ-state.aiEngines.video */
  videoEngine: "auto" | "replicate" | "gemini";
  nativeAudio: boolean;
  multiShot: MultiShotTemplateId;
  onDurationChange: (value: StudioVideoDurationSec) => void;
  onMotionChange: (value: StudioVideoMotionMode) => void;
  onNativeAudioChange: (value: boolean) => void;
  onMultiShotChange: (value: MultiShotTemplateId) => void;
  disabled?: boolean;
}) {
  const klingFeatures = motion === "ai" && videoEngine !== "gemini";

  return (
    <StudioSection title="אפשרויות וידאו">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-xs font-light text-muted-foreground">סוג תנועה</p>
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

        {klingFeatures && (
          <div className="space-y-1.5">
            <p className="text-xs font-light text-muted-foreground">
              תבנית צילומים (מולטי-שוט)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onMultiShotChange("none")}
                className={cn(
                  "border px-2 py-1.5 text-xs font-light transition-colors disabled:opacity-50",
                  multiShot === "none"
                    ? "border-gold bg-gold/10"
                    : "border-border/60 hover:border-gold/40"
                )}
              >
                צילום אחד רציף
              </button>
              {MULTISHOT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={disabled}
                  title={template.description}
                  onClick={() => onMultiShotChange(template.id)}
                  className={cn(
                    "border px-2 py-1.5 text-xs font-light transition-colors disabled:opacity-50",
                    multiShot === template.id
                      ? "border-gold bg-gold/10"
                      : "border-border/60 hover:border-gold/40"
                  )}
                >
                  {template.label}
                </button>
              ))}
            </div>
            {multiShot !== "none" && (
              <p className="text-[10px] font-light text-muted-foreground">
                {MULTISHOT_TEMPLATES.find((t) => t.id === multiShot)?.description}
              </p>
            )}

            <label className="flex items-center justify-between gap-2 pt-1 text-xs font-light">
              <span>אודיו נטיבי של Kling</span>
              <input
                type="checkbox"
                checked={nativeAudio}
                disabled={disabled}
                onChange={(e) => onNativeAudioChange(e.target.checked)}
                className="h-4 w-4 accent-[#c9a961]"
              />
            </label>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-light text-muted-foreground">משך (שניות)</p>
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
    </StudioSection>
  );
}
