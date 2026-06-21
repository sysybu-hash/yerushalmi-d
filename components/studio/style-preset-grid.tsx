"use client";

import {
  STUDIO_STYLE_PRESETS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";

const PRESET_VISUALS: Record<
  StudioStylePresetId,
  { swatch: string; subtitle: string }
> = {
  "luxury-marble": {
    swatch: "linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 50%, #c9a962 100%)",
    subtitle: "שיש שחור, תאורה דרמטית",
  },
  "black-velvet": {
    swatch: "linear-gradient(160deg, #0d0d0d 0%, #2a2a2a 100%)",
    subtitle: "קטיפה, נצנוץ יהלומים",
  },
  "white-studio": {
    swatch: "linear-gradient(180deg, #ffffff 0%, #e8e8e8 100%)",
    subtitle: "קטלוג נקי לחנות",
  },
  "gold-bokeh": {
    swatch: "linear-gradient(135deg, #1f1408 0%, #c9a962 60%, #fff4d6 100%)",
    subtitle: "זהב ובוקה קולנועי",
  },
  lifestyle: {
    swatch: "linear-gradient(135deg, #f5f0ea 0%, #d4c4b0 50%, #8a7355 100%)",
    subtitle: "עריכה מגזינית",
  },
};

export function StylePresetGrid({
  value,
  onChange,
  disabled,
}: {
  value: StudioStylePresetId;
  onChange: (id: StudioStylePresetId) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="סגנון רקע"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {STUDIO_STYLE_PRESETS.map((preset) => {
        const selected = value === preset.id;
        const visual = PRESET_VISUALS[preset.id];

        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(preset.id)}
            className={`flex items-center gap-3 border p-3 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              selected
                ? "border-gold bg-gold/10 ring-1 ring-gold/40"
                : "border-border/60 bg-background hover:border-gold/40"
            }`}
          >
            <span
              aria-hidden
              className="h-12 w-12 shrink-0 border border-border/40"
              style={{ background: visual.swatch }}
            />
            <span className="min-w-0">
              <span className="block text-sm font-light">{preset.label}</span>
              <span className="mt-0.5 block text-[11px] font-light text-muted-foreground">
                {visual.subtitle}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
