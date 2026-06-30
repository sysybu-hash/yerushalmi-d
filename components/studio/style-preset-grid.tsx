"use client";

import { Check } from "lucide-react";

import {
  STUDIO_STYLE_PRESETS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
import { cn } from "@/lib/utils";

const PRESET_VISUALS: Record<
  StudioStylePresetId,
  { swatch: string; subtitle: string; accent?: string }
> = {
  "luxury-marble": {
    swatch: "linear-gradient(145deg, #0f0f0f 0%, #3d3d3d 42%, #8a7a5a 78%, #d4c4a0 100%)",
    subtitle: "שיש שחור · תאורה דרמטית",
    accent: "rgba(212, 175, 90, 0.35)",
  },
  "black-velvet": {
    swatch: "radial-gradient(ellipse at 50% 35%, #2a2a2a 0%, #0a0a0a 70%)",
    subtitle: "קטיפה · נצנוץ יהלומים",
    accent: "rgba(255, 255, 255, 0.08)",
  },
  "white-studio": {
    swatch: "linear-gradient(180deg, #ffffff 0%, #ececec 55%, #d8d8d8 100%)",
    subtitle: "קטלוג נקי לחנות",
    accent: "rgba(255, 255, 255, 0.5)",
  },
  "gold-bokeh": {
    swatch: "radial-gradient(circle at 25% 30%, #c9a962 0%, #1a1208 55%, #0d0a06 100%)",
    subtitle: "זהב ובוקה קולנועי",
    accent: "rgba(255, 220, 140, 0.25)",
  },
  lifestyle: {
    swatch: "linear-gradient(135deg, #faf6f0 0%, #e0d0bc 45%, #9a8068 100%)",
    subtitle: "עריכה מגזינית",
    accent: "rgba(255, 248, 240, 0.3)",
  },
  "rose-gold-glow": {
    swatch: "radial-gradient(ellipse at 50% 40%, #ffd8d0 0%, #e8a898 40%, #c9a070 100%)",
    subtitle: "רומנטי · זהב ורוד",
    accent: "rgba(255, 200, 190, 0.4)",
  },
  "midnight-blue": {
    swatch: "radial-gradient(ellipse at 50% 38%, #2a5088 0%, #0a1628 65%, #050a14 100%)",
    subtitle: "כחול עמוק · כסף",
    accent: "rgba(140, 180, 255, 0.2)",
  },
  "champagne-silk": {
    swatch: "linear-gradient(160deg, #fffaf2 0%, #f2e4cc 50%, #d8c0a0 100%)",
    subtitle: "משי שמפניה · חתונה",
    accent: "rgba(255, 250, 240, 0.45)",
  },
  "jerusalem-stone": {
    swatch: "linear-gradient(135deg, #f0e0c8 0%, #d4b888 45%, #a88858 100%)",
    subtitle: "אבן חמה · ירושלמי",
    accent: "rgba(255, 235, 200, 0.35)",
  },
  "concrete-minimal": {
    swatch: "linear-gradient(180deg, #f4f4f4 0%, #d0d0d0 50%, #a8a8a8 100%)",
    subtitle: "מודרני · מינימליסטי",
    accent: "rgba(255, 255, 255, 0.35)",
  },
  "botanical-soft": {
    swatch: "radial-gradient(ellipse at 30% 35%, #c8dcc0 0%, #f5f8f2 50%, #88a878 100%)",
    subtitle: "ירוק רך · טבעי",
    accent: "rgba(200, 230, 190, 0.35)",
  },
  "mirror-glass": {
    swatch: "linear-gradient(180deg, #4a5568 0%, #1e2430 40%, #0a0c10 100%)",
    subtitle: "זכוכית משקפת",
    accent: "rgba(200, 220, 255, 0.15)",
  },
  "royal-purple": {
    swatch: "radial-gradient(ellipse at 50% 40%, #6a3888 0%, #2a1040 60%, #120820 100%)",
    subtitle: "סגול מלכותי",
    accent: "rgba(200, 150, 255, 0.2)",
  },
  "sunset-amber": {
    swatch: "radial-gradient(ellipse at 50% 30%, #ffc870 0%, #e87830 45%, #8a4018 100%)",
    subtitle: "שקיעה חמה · ענבר",
    accent: "rgba(255, 200, 100, 0.35)",
  },
};

function PresetPreview({
  swatch,
  accent,
  selected,
}: {
  swatch: string;
  accent?: string;
  selected: boolean;
}) {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden">
      <div className="absolute inset-0 scale-105" style={{ background: swatch }} />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 28%, ${accent ?? "rgba(255,255,255,0.15)"} 0%, transparent 58%)`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />

      {selected && (
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center border border-gold/60 bg-gold text-charcoal shadow-sm">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        </span>
      )}
    </div>
  );
}

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
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
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
            className={cn(
              "group flex flex-col overflow-hidden border text-right transition-all duration-200",
              "disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-gold bg-gold/[0.06] shadow-[0_0_0_1px_rgba(201,169,98,0.35)]"
                : "border-border/50 bg-background hover:border-gold/35 hover:shadow-sm"
            )}
          >
            <PresetPreview
              swatch={visual.swatch}
              accent={visual.accent}
              selected={selected}
            />

            <div className="flex flex-1 flex-col justify-center px-3 py-2.5">
              <span
                className={cn(
                  "font-serif text-[13px] leading-snug tracking-wide transition-colors",
                  selected ? "text-foreground" : "text-foreground/90"
                )}
              >
                {preset.label}
              </span>
              <span className="mt-1 block text-[10px] font-light leading-relaxed tracking-[0.04em] text-muted-foreground">
                {visual.subtitle}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
