"use client";

import { Star, Trash2 } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { cn } from "@/lib/utils";

/**
 * מסילת ניסיונות — כל רקע/וידאו שנוצר בהצלחה בסשן הנוכחי, לא רק
 * התוצאה האחרונה. לחיצה על ⭐ מחזירה ניסיון קודם לתוצאה הפעילה בלי
 * לחייב מחדש; 🗑 מסיר מהמסילה בלבד (לא מוחק שום דבר שמור).
 */
export function AttemptsRail({ kind }: { kind: "background" | "video" }) {
  const attempts = useStudioBetaStore((s) => s.attempts);
  const selectAttempt = useStudioBetaStore((s) => s.selectAttempt);
  const deleteAttempt = useStudioBetaStore((s) => s.deleteAttempt);
  const activeUrl = useStudioBetaStore((s) =>
    kind === "background" ? s.background.url : s.video.url
  );

  const filtered = attempts.filter((a) => a.kind === kind);
  if (filtered.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-light text-muted-foreground">
        ניסיונות קודמים ({filtered.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtered.map((attempt) => {
          const active = attempt.url === activeUrl;
          return (
            <div
              key={attempt.id}
              className={cn(
                "group relative h-16 w-16 shrink-0 overflow-hidden border",
                active ? "border-gold" : "border-border/60"
              )}
            >
              {attempt.mediaKind === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={attempt.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attempt.url}
                  alt={attempt.label}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/50 via-transparent to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => selectAttempt(attempt.id)}
                  title="השתמש בניסיון הזה"
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full bg-background/90",
                    active ? "text-gold-dark" : "text-muted-foreground hover:text-gold-dark"
                  )}
                >
                  <Star className="h-3 w-3" fill={active ? "currentColor" : "none"} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteAttempt(attempt.id)}
                  title="הסרה מהמסילה"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground hover:text-destructive"
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
