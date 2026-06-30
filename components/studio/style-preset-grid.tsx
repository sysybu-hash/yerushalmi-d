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
  "rose-gold-glow": {
    swatch: "linear-gradient(135deg, #ffe8e4 0%, #e8b4a8 50%, #c9a962 100%)",
    subtitle: "רומנטי, זהב ורוד",
  },
  "midnight-blue": {
    swatch: "linear-gradient(160deg, #0a1628 0%, #1a3a6e 50%, #7090c8 100%)",
    subtitle: "כחול עמוק, כסף",
  },
  "champagne-silk": {
    swatch: "linear-gradient(180deg, #fff8ee 0%, #f0e0c8 50%, #d4b896 100%)",
    subtitle: "משי שמפניה, חתונה",
  },
  "jerusalem-stone": {
    swatch: "linear-gradient(135deg, #e8d5b5 0%, #c9a87a 50%, #a08050 100%)",
    subtitle: "אבן חמה, ירושלמי",
  },
  "concrete-minimal": {
    swatch: "linear-gradient(180deg, #f0f0f0 0%, #c8c8c8 50%, #989898 100%)",
    subtitle: "מודרני, מינימליסטי",
  },
  "botanical-soft": {
    swatch: "linear-gradient(135deg, #f5f8f2 0%, #b8cdb0 50%, #6a8a60 100%)",
    subtitle: "ירוק רך, טבעי",
  },
  "mirror-glass": {
    swatch: "linear-gradient(180deg, #2a3040 0%, #5a6478 50%, #c0c8d8 100%)",
    subtitle: "זכוכית משקפת",
  },
  "royal-purple": {
    swatch: "linear-gradient(135deg, #1a0828 0%, #5a2878 50%, #c9a0e0 100%)",
    subtitle: "סגול מלכותי",
  },
  "sunset-amber": {
    swatch: "linear-gradient(135deg, #fff0d0 0%, #ffb060 50%, #e87830 100%)",
    subtitle: "שקיעה חמה, ענבר",
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
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
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
