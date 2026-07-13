"use client";

import { AdjustSlider, ToggleChip } from "@/components/studio/studio-adjust-ui";
import type { SourceAdjustments } from "@/lib/studio-beta/cloudinary-transform";

export function AdjustPanel({
  value,
  onChange,
  onAutoEnhanceChange,
  onReset,
}: {
  value: SourceAdjustments;
  onChange: (key: "brightness" | "saturation" | "contrast", v: number) => void;
  onAutoEnhanceChange: (enabled: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ToggleChip
          label="שיפור אוטומטי"
          active={value.autoEnhance}
          onClick={() => onAutoEnhanceChange(!value.autoEnhance)}
        />
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-light text-muted-foreground hover:text-foreground"
        >
          איפוס
        </button>
      </div>
      <AdjustSlider
        label="בהירות"
        value={value.brightness}
        onChange={(v) => onChange("brightness", v)}
      />
      <AdjustSlider
        label="רוויה"
        value={value.saturation}
        onChange={(v) => onChange("saturation", v)}
      />
      <AdjustSlider
        label="קונטרסט"
        value={value.contrast}
        onChange={(v) => onChange("contrast", v)}
      />
    </div>
  );
}
