"use client";

import Image from "next/image";
import { Clapperboard, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StudioCostChip } from "./studio-cost-chip";

/** דיאלוג אישור לפעולה בתשלום — מחליף את window.confirm */
export function StudioConfirmDialog({
  open,
  title,
  description,
  costLabel,
  previewUrl,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  costLabel: string;
  previewUrl?: string | null;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border border-gold/40 bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h3 className="flex items-center gap-2 font-serif text-lg font-light">
            <Clapperboard className="h-4 w-4 text-gold-dark" />
            {title}
          </h3>
          <button onClick={onCancel} aria-label="ביטול">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {previewUrl && (
          <div className="relative mb-3 aspect-square w-full overflow-hidden border border-border/60">
            <Image
              src={previewUrl}
              alt="תצוגה מקדימה"
              fill
              className="object-cover"
              sizes="384px"
              unoptimized
            />
          </div>
        )}

        <p className="mb-2 text-sm font-light text-muted-foreground">
          {description}
        </p>
        <div className="mb-4 flex items-center gap-2 text-xs font-light">
          <span>עלות משוערת:</span>
          <StudioCostChip label={costLabel} />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onConfirm}
            className="flex-1 rounded-none bg-gold text-sm font-light text-black hover:bg-gold/90"
          >
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="rounded-none text-sm font-light"
          >
            ביטול
          </Button>
        </div>
      </div>
    </div>
  );
}
