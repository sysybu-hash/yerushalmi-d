"use client";

import type { AiEngineProvider } from "@/lib/ai-engines";
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

/** אפשרויות וידאו מינימליות — משך + סוג תנועה. השאר בהגדרות מתקדמות */
const VIDEO_ENGINE_CHOICES: {
  value: AiEngineProvider;
  label: string;
  hint: string;
}[] = [
  { value: "auto", label: "אוטומטי", hint: "Kling, ומעבר ל-Veo אם אין קרדיט" },
  { value: "replicate", label: "Kling 3", hint: "תנועה עקבית, ‎₪1.30~ — דרך Replicate" },
  { value: "gemini", label: "Veo 3.1", hint: "איכות קולנועית, ‎₪1.50–2.20~ — דרך Google" },
];

export function StudioVideoOptions({
  duration,
  motion,
  videoEngine,
  nativeAudio,
  multiShot,
  onDurationChange,
  onMotionChange,
  onVideoEngineChange,
  onNativeAudioChange,
  onMultiShotChange,
  disabled,
}: {
  duration: StudioVideoDurationSec;
  motion: StudioVideoMotionMode;
  videoEngine: AiEngineProvider;
  nativeAudio: boolean;
  multiShot: MultiShotTemplateId;
  onDurationChange: (value: StudioVideoDurationSec) => void;
  onMotionChange: (value: StudioVideoMotionMode) => void;
  onVideoEngineChange: (value: AiEngineProvider) => void;
  onNativeAudioChange: (value: boolean) => void;
  onMultiShotChange: (value: MultiShotTemplateId) => void;
  disabled?: boolean;
}) {
  // מולטי-שוט ואודיו נטיבי — יכולות של Kling בלבד (לא Veo)
  const klingFeatures = motion === "ai" && videoEngine !== "gemini";
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

      {motion === "ai" && (
        <div className="space-y-1.5">
          <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
            מנוע וידאו
          </p>
          <div className="grid grid-cols-3 gap-2">
            {VIDEO_ENGINE_CHOICES.map((choice) => (
              <button
                key={choice.value}
                type="button"
                disabled={disabled}
                title={choice.hint}
                onClick={() => onVideoEngineChange(choice.value)}
                className={cn(
                  "border px-2 py-1.5 text-xs font-light transition-colors disabled:opacity-50",
                  videoEngine === choice.value
                    ? "border-gold bg-gold/10"
                    : "border-border/60 hover:border-gold/40"
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-light text-muted-foreground">
            {VIDEO_ENGINE_CHOICES.find((c) => c.value === videoEngine)?.hint}
          </p>
        </div>
      )}

      {klingFeatures && (
        <div className="space-y-1.5">
          <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
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
            <span>אודיו נטיבי של Kling (סאונד שנוצר עם הווידאו)</span>
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
