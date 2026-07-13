"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { CostBadge } from "@/components/studio-beta/cost-badge";
import { useStudioBetaStore } from "@/lib/studio-beta/store";
import { cn } from "@/lib/utils";
import type { SourcePrepPresetId } from "@/lib/studio-beta/source-prep-pipeline";

const PRESETS: { id: SourcePrepPresetId; label: string }[] = [
  { id: "complete", label: "השלמת קצוות חתוכים" },
  { id: "cleanup", label: "ניקוי רקע" },
  { id: "enhance", label: "חידוד ושיפור" },
];

export function SourcePrepPanel() {
  const sourcePrep = useStudioBetaStore((s) => s.sourcePrep);
  const originalSourceImageUrl = useStudioBetaStore((s) => s.originalSourceImageUrl);
  const sourceImageUrl = useStudioBetaStore((s) => s.sourceImageUrl);
  const runSourcePrep = useStudioBetaStore((s) => s.runSourcePrep);
  const revertToOriginalSource = useStudioBetaStore((s) => s.revertToOriginalSource);

  const loading = sourcePrep.status === "loading";
  const canRevert =
    originalSourceImageUrl !== null && originalSourceImageUrl !== sourceImageUrl;

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-light text-muted-foreground">
        הכנת מקור ב-AI (אופציונלי) — כל פעולה מחליפה את תמונת העבודה
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={loading}
            onClick={() => runSourcePrep(preset.id, null, preset.label)}
            className={cn(
              "border px-2.5 py-1.5 text-[11px] font-light transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              sourcePrep.appliedLabel === preset.label
                ? "border-gold bg-gold/10 text-gold-dark"
                : "border-border/60 text-muted-foreground hover:border-gold/60 hover:text-foreground"
            )}
          >
            {preset.label}
          </button>
        ))}
        {canRevert && (
          <button
            type="button"
            onClick={revertToOriginalSource}
            className="flex items-center gap-1 border border-border/60 px-2.5 py-1.5 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
            שחזור למקור
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[11px] font-light text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          מעבד...
        </div>
      )}

      {sourcePrep.status === "done" && sourcePrep.costUsd > 0 && (
        <CostBadge costUsd={sourcePrep.costUsd} />
      )}

      {sourcePrep.error && (
        <p className="text-[11px] font-light text-destructive">{sourcePrep.error}</p>
      )}
    </div>
  );
}
