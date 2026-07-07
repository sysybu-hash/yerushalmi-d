"use client";

import { AlertTriangle, RotateCcw, X } from "lucide-react";

import type { StudioErrorInfo } from "@/lib/studio-client/state";
import { Button } from "@/components/ui/button";

/**
 * באנר שגיאה — "נסה שוב" מפעיל את הפעולה עם אותו מפתח idempotency,
 * כך שניסיון חוזר לעולם לא מחייב פעמיים.
 */
export function StudioErrorBanner({
  error,
  busy,
  onRetry,
  onDismiss,
}: {
  error: StudioErrorInfo | null;
  busy: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  if (!error) return null;

  return (
    <div
      className="flex items-start gap-3 border border-red-300 bg-red-50 px-4 py-3"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-light text-red-800">{error.message}</p>
        {error.retryable && (
          <p className="text-[11px] font-light text-red-600">
            ניסיון חוזר לא יחויב פעמיים — הפעולה מזוהה באותו מפתח.
          </p>
        )}
      </div>
      {error.retryable && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={onRetry}
          className="rounded-none border-red-300 text-xs font-light text-red-700 hover:bg-red-100"
        >
          <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
          נסה שוב
        </Button>
      )}
      <button
        onClick={onDismiss}
        aria-label="סגירה"
        className="text-red-400 hover:text-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
