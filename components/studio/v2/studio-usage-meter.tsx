"use client";

import { Gauge } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import { cn } from "@/lib/utils";

/** מד שימוש יומי — כמה נוצל מהמכסה וכמה עלה היום */
export function StudioUsageMeter({
  usage,
}: {
  usage: StudioV2State["usage"];
}) {
  if (!usage) return null;

  const videoWarn =
    usage.videoLimit > 0 && usage.videosToday >= usage.videoLimit * 0.8;
  const imageWarn =
    usage.imageLimit > 0 && usage.imagesToday >= usage.imageLimit * 0.8;

  return (
    <div
      className={cn(
        "flex items-center gap-3 border px-3 py-1.5 text-[11px] font-light",
        videoWarn || imageWarn
          ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
          : "border-border/60 bg-background text-muted-foreground"
      )}
      title="שימוש יומי בסטודיו — קריאות AI בתשלום בלבד"
    >
      <Gauge className="h-3.5 w-3.5" />
      <span>
        תמונות {usage.imagesToday}
        {usage.imageLimit > 0 ? `/${usage.imageLimit}` : ""}
      </span>
      <span>
        וידאו {usage.videosToday}
        {usage.videoLimit > 0 ? `/${usage.videoLimit}` : ""}
      </span>
      <span dir="ltr">${usage.costTodayUsd.toFixed(2)}</span>
    </div>
  );
}
