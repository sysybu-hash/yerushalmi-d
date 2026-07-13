"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Gauge } from "lucide-react";
import { useStudioBetaStore } from "@/lib/studio-beta/store";

/** מד עלות פסיבי — לא חוסם שום פעולה, רק שקיפות */
export function SessionCostMeter() {
  const sessionCostUsd = useStudioBetaStore((state) => state.sessionCostUsd);
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
        עלות ההפעלה: ${sessionCostUsd.toFixed(3)}
      </div>
      {dailyUsd !== null && (
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.25} />
          היום: ${dailyUsd.toFixed(3)}
        </div>
      )}
    </div>
  );
}
