"use client";

import { Gauge } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";

/** מד עלות פסיבי — לא חוסם שום פעולה, רק שקיפות */
export function SessionCostMeter() {
  const sessionCostUsd = useStudioBetaStore((state) => state.sessionCostUsd);

  return (
    <div className="flex items-center gap-1.5 text-xs font-light tracking-wide text-muted-foreground">
      <Gauge className="h-3.5 w-3.5" strokeWidth={1.25} />
      עלות ההפעלה: ${sessionCostUsd.toFixed(3)}
    </div>
  );
}
