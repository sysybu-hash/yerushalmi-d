"use client";

import { X } from "lucide-react";

export function ResetBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border border-gold/40 bg-gold/10 px-3 py-2 text-xs font-light">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="סגירה"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
