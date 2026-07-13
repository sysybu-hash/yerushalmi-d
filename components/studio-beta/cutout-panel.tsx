"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompareToggle } from "@/components/studio-beta/compare-toggle";
import { CostBadge } from "@/components/studio-beta/cost-badge";
import { useStudioBetaStore } from "@/lib/studio-beta/store";

/**
 * שער בידוד ידני — מוצג רק כשהמנוע הנבחר משתמש בבידוד (usesCutout).
 * חוסם את כפתור "צור רקע" עד אישור, בלי דיאלוג חוסם — הנעילה היא
 * מצב UI (disabled), לא window.confirm.
 */
export function CutoutPanel({ sourceImageUrl }: { sourceImageUrl: string }) {
  const cutout = useStudioBetaStore((s) => s.cutout);
  const runCutout = useStudioBetaStore((s) => s.runCutout);
  const retryCutout = useStudioBetaStore((s) => s.retryCutout);
  const approveCutout = useStudioBetaStore((s) => s.approveCutout);

  const loading = cutout.status === "loading";

  return (
    <div className="space-y-2.5 border border-border/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-light tracking-wide text-muted-foreground">
          שער בידוד — בדקו את הבידוד לפני יצירת הרקע
        </p>
        {cutout.costUsd > 0 && <CostBadge costUsd={cutout.costUsd} />}
      </div>

      {cutout.status === "idle" && (
        <Button
          type="button"
          onClick={runCutout}
          className="w-full rounded-none text-xs tracking-[0.1em]"
        >
          בידוד התכשיט
        </Button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs font-light text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          מבודד...
        </div>
      )}

      {cutout.status === "error" && (
        <div className="space-y-2">
          <p className="text-xs font-light text-destructive">{cutout.error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={retryCutout}
            className="w-full rounded-none text-xs tracking-[0.1em]"
          >
            <RefreshCw className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
            נסה שוב
          </Button>
        </div>
      )}

      {cutout.status === "done" && cutout.url && (
        <div className="space-y-2">
          <CompareToggle
            originalUrl={sourceImageUrl}
            resultUrl={cutout.url}
            alt="תוצאת הבידוד"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={retryCutout}
              className="flex-1 rounded-none text-xs tracking-[0.1em]"
            >
              <RefreshCw className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
              נסה שוב
            </Button>
            <Button
              type="button"
              onClick={approveCutout}
              disabled={cutout.approved}
              className="flex-1 rounded-none text-xs tracking-[0.1em]"
            >
              {cutout.approved ? "אושר" : "אשר והמשך"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
