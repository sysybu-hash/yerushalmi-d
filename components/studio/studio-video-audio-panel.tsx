"use client";

import { Music2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  STUDIO_AUDIO_STYLES,
  getAudioStyle,
} from "@/lib/studio-audio-presets";
import type { VideoAdjustments } from "@/lib/studio-transform";
import {
  AdjustSlider,
  ToggleChip,
} from "@/components/studio/studio-adjust-ui";

type StudioVideoAudioPanelProps = {
  adjustments: VideoAdjustments;
  onChange: (next: VideoAdjustments) => void;
  disabled?: boolean;
};

export function StudioVideoAudioPanel({
  adjustments,
  onChange,
  disabled,
}: StudioVideoAudioPanelProps) {
  const styles = STUDIO_AUDIO_STYLES.filter((s) => s.id !== "none");

  function patch(partial: Partial<VideoAdjustments>) {
    onChange({ ...adjustments, ...partial });
  }

  return (
    <div className="space-y-4 rounded-none border border-border/60 bg-muted/10 p-4">
      <div className="flex items-center gap-2">
        <Music2 aria-hidden className="h-4 w-4 text-gold-dark" strokeWidth={1.5} />
        <Label className="font-light">מוזיקת רקע מותאמת</Label>
      </div>
      <p className="text-[11px] font-light text-muted-foreground">
        מחליפה את האודיו המקורי במוזיקת רקע לפי סגנון — מתאים לריל, סטורי ופרסום.
      </p>

      <div className="flex flex-wrap gap-2">
        {STUDIO_AUDIO_STYLES.map((style) => (
          <ToggleChip
            key={style.id}
            label={style.label}
            active={adjustments.audioStyle === style.id}
            disabled={disabled}
            onClick={() =>
              patch({
                audioStyle: style.id,
                mute: style.id === "none",
              })
            }
          />
        ))}
      </div>

      {adjustments.audioStyle !== "none" &&
        adjustments.audioStyle !== "original" && (
          <AdjustSlider
            label="עוצמת המוזיקה"
            value={adjustments.audioVolume}
            min={10}
            max={80}
            step={5}
            disabled={disabled}
            onChange={(v) => patch({ audioVolume: v })}
          />
        )}

      <p className="text-[10px] font-light text-muted-foreground">
        {getAudioStyle(adjustments.audioStyle).description}
      </p>

      <div className="flex flex-wrap gap-2">
        <ToggleChip
          label="השתקה מלאה"
          active={adjustments.mute || adjustments.audioStyle === "none"}
          disabled={disabled}
          onClick={() =>
            patch({
              mute: !adjustments.mute,
              audioStyle: adjustments.mute ? "original" : "none",
            })
          }
        />
      </div>
    </div>
  );
}
