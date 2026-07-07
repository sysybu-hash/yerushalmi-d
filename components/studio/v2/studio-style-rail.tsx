"use client";

import { Check } from "lucide-react";

import {
  STUDIO_STYLE_PRESETS,
  type StudioStylePresetId,
} from "@/lib/studio-presets";
import { cn } from "@/lib/utils";

/** גרדיאנט מייצג לכל פריסט — תצוגה בלי קריאת API */
const PRESET_SWATCHES: Record<StudioStylePresetId, string> = {
  "luxury-marble": "linear-gradient(135deg, #0d0d0f 0%, #2a2a30 55%, #c9a961 130%)",
  "black-velvet": "linear-gradient(135deg, #050507 0%, #1c1c22 70%, #3a3a44 100%)",
  "white-studio": "linear-gradient(135deg, #ffffff 0%, #f1f1f3 60%, #e2e2e6 100%)",
  "gold-bokeh": "linear-gradient(135deg, #17130c 0%, #3c2f18 55%, #a8863a 120%)",
  lifestyle: "linear-gradient(135deg, #d9c9b6 0%, #efe4d6 55%, #c8b49c 100%)",
  "rose-gold-glow": "linear-gradient(135deg, #e8c4bb 0%, #f4ded8 55%, #d9a99b 100%)",
  "midnight-blue": "linear-gradient(135deg, #0a1226 0%, #16264a 60%, #2b4a7a 110%)",
  "champagne-silk": "linear-gradient(135deg, #efe2cc 0%, #f8f0e0 55%, #dcc7a4 100%)",
  "jerusalem-stone": "linear-gradient(135deg, #d8c4a2 0%, #e9dcc2 55%, #c2a877 100%)",
  "concrete-minimal": "linear-gradient(135deg, #b9bcc0 0%, #d7d9dc 55%, #9ea2a8 100%)",
  "botanical-soft": "linear-gradient(135deg, #a9bda6 0%, #ccd9c8 55%, #8ba287 100%)",
  "mirror-glass": "linear-gradient(135deg, #0c0e10 0%, #24282e 45%, #565e68 100%)",
  "royal-purple": "linear-gradient(135deg, #241033 0%, #3e1e57 55%, #6a3d92 110%)",
  "sunset-amber": "linear-gradient(135deg, #c07a2e 0%, #e0a557 55%, #8f5a1e 110%)",
};

export function StudioStyleRail({
  value,
  onChange,
  disabled,
}: {
  value: StudioStylePresetId;
  onChange: (presetId: StudioStylePresetId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
        סגנון רקע
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {STUDIO_STYLE_PRESETS.map((preset) => {
          const active = preset.id === value;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.id)}
              title={preset.label}
              className={cn(
                "group relative aspect-square overflow-hidden border transition-all disabled:opacity-50",
                active
                  ? "border-gold ring-1 ring-gold"
                  : "border-border/60 hover:border-gold/50"
              )}
              style={{ background: PRESET_SWATCHES[preset.id] }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="h-4 w-4 text-white drop-shadow" />
                </span>
              )}
              <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-center text-[9px] font-light text-white">
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
