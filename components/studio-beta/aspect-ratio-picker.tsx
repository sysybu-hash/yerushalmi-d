"use client";

import { cn } from "@/lib/utils";
import type { SourceAspect } from "@/lib/studio-beta/cloudinary-transform";

const ASPECT_OPTIONS: { id: SourceAspect; label: string }[] = [
  { id: "original", label: "מקורי" },
  { id: "1:1", label: "1:1" },
  { id: "4:5", label: "4:5" },
  { id: "9:16", label: "9:16" },
  { id: "16:9", label: "16:9" },
];

export function AspectRatioPicker({
  value,
  onChange,
}: {
  value: SourceAspect;
  onChange: (aspect: SourceAspect) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ASPECT_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "border px-3 py-1 text-xs font-light transition-colors",
            value === option.id
              ? "border-gold bg-gold/10 text-gold-dark"
              : "border-border/60 text-muted-foreground hover:border-gold/60"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
