"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Gauge } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { formatStudioCost } from "@/lib/studio-beta/currency";
import { cn } from "@/lib/utils";

/** מד עלות פסיבי — לא חוסם שום פעולה, רק שקיפות */
export function SessionCostMeter() {
  const sessionCostUsd = useStudioBetaStore((state) => state.sessionCostUsd);
  const currency = useStudioBetaStore((state) => state.currency);
  const setCurrency = useStudioBetaStore((state) => state.setCurrency);
  const [dailyUsd, setDailyUsd] = useState<number | null>(null);

  // נטען פעם אחת בטעינת הדף — לא polling, רק שקיפות למה שכבר קרה היום
  useEffect(() => {
    fetch("/api/studio-beta/usage")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) setDailyUsd(json.totalUsd ?? 0);
      })
      .catch(() => {
        // כשל שליפת עלות יומית לא אמור להפריע לעבודה — פשוט לא מציגים
      });
  }, []);

  return (
    <div className="flex items-center gap-3 text-xs font-light tracking-wide text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Gauge className="h-3.5 w-3.5" strokeWidth={1.25} />
        עלות ההפעלה: {formatStudioCost(sessionCostUsd, currency)}
      </div>
      {dailyUsd !== null && (
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.25} />
          היום: {formatStudioCost(dailyUsd, currency)}
        </div>
      )}
      <div className="flex border border-border/60 text-[11px]">
        <button
          type="button"
          onClick={() => setCurrency("usd")}
          className={cn(
            "px-1.5 py-0.5",
            currency === "usd"
              ? "bg-gold/10 text-gold-dark"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          $
        </button>
        <button
          type="button"
          onClick={() => setCurrency("ils")}
          className={cn(
            "border-r border-border/60 px-1.5 py-0.5",
            currency === "ils"
              ? "bg-gold/10 text-gold-dark"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          ₪
        </button>
      </div>
    </div>
  );
}
