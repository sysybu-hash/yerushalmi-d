"use client";

import { Gauge } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import { ILS_PER_USD } from "./studio-cost-chip";

/** מד שימוש יומי — כמה נוצר היום וכמה זה עלה. מידע בלבד, בלי מכסות. */
export function StudioUsageMeter({
  usage,
}: {
  usage: StudioV2State["usage"];
}) {
  if (!usage) return null;

  return (
    <div
      className="flex items-center gap-3 border border-border/60 bg-background px-3 py-1.5 text-[11px] font-light text-muted-foreground"
      title="שימוש יומי בסטודיו — קריאות AI בתשלום בלבד"
    >
      <Gauge className="h-3.5 w-3.5" />
      <span>תמונות {usage.imagesToday}</span>
      <span>וידאו {usage.videosToday}</span>
      <span dir="ltr" title={`$${usage.costTodayUsd.toFixed(2)}`}>
        ₪{(usage.costTodayUsd * ILS_PER_USD).toFixed(2)}
      </span>
    </div>
  );
}
