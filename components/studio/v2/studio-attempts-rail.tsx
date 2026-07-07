"use client";

/* eslint-disable @next/next/no-img-element */

import { Clapperboard, Star, Trash2 } from "lucide-react";

import type { StudioAttempt } from "@/lib/studio-client/state";
import { cn } from "@/lib/utils";

/**
 * גלריית הניסיונות — כל תצוגה מקדימה ותוצאה נשמרות כאן.
 * לחיצה מציגה בקנבס; כוכב הופך לתוצאה הנבחרת; פח מוחק מהגלריה.
 */
export function StudioAttemptsRail({
  attempts,
  selectedId,
  currentUrl,
  onSelect,
  onUseAsResult,
  onDelete,
  disabled,
}: {
  attempts: StudioAttempt[];
  selectedId: string | null;
  /** ה-URL שמוצג כרגע בקנבס — לסימון */
  currentUrl: string | null;
  onSelect: (id: string | null) => void;
  onUseAsResult: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  if (attempts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
          הניסיונות שלכם ({attempts.length}) — לחצו להשוואה
        </p>
        {selectedId && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-[10px] font-light text-gold-dark hover:underline"
          >
            חזרה לעדכני
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" dir="rtl">
        {attempts.map((attempt) => {
          const active =
            attempt.id === selectedId ||
            (!selectedId && attempt.url === currentUrl);
          return (
            <div
              key={attempt.id}
              className={cn(
                "group relative w-20 shrink-0 border transition-all",
                active
                  ? "border-gold ring-1 ring-gold"
                  : "border-border/60 hover:border-gold/50"
              )}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onSelect(attempt.id === selectedId ? null : attempt.id)
                }
                className="block aspect-square w-full overflow-hidden bg-muted/30"
                title={`${attempt.label} · ${attempt.free ? "חינם" : "בתשלום"}`}
              >
                {attempt.kind === "video" ? (
                  <span className="flex h-full w-full items-center justify-center bg-black/80">
                    <Clapperboard className="h-6 w-6 text-gold" />
                  </span>
                ) : (
                  <img
                    src={attempt.url}
                    alt={attempt.label}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </button>

              <span className="block truncate bg-black/60 px-1 py-0.5 text-center text-[8px] font-light text-white">
                {attempt.label}
              </span>

              <div className="absolute left-0.5 top-0.5 hidden gap-0.5 group-hover:flex">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onUseAsResult(attempt.id)}
                  title="הפוך לתוצאה הנבחרת"
                  className="bg-black/70 p-1 text-gold hover:bg-black"
                >
                  <Star className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onDelete(attempt.id)}
                  title="הסרה מהגלריה"
                  className="bg-black/70 p-1 text-red-400 hover:bg-black"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
