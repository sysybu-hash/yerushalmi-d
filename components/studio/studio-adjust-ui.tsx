"use client";

import { Label } from "@/components/ui/label";

export function AdjustSlider({
  label,
  value,
  onChange,
  disabled,
  min = -50,
  max = 50,
  step = 5,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-light text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-foreground/70">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border accent-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={label}
      />
    </div>
  );
}

export function ToggleChip({
  label,
  active,
  onClick,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={
        "border px-3 py-1.5 text-[12px] font-light transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
        (active
          ? "border-gold bg-gold/15 text-gold-dark"
          : "border-border/60 text-muted-foreground hover:border-gold/50 hover:text-foreground")
      }
    >
      {label}
    </button>
  );
}
