"use client";

import type { ReactNode } from "react";

/** מעטפת לסקשן קבוע בפאנל הצד — תמיד גלוי, ללא אקורדיון */
export function StudioSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 border border-border/60 p-3">
      <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}
