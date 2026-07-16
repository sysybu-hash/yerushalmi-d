"use client";

import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostBadge } from "@/components/studio-beta/cost-badge";
import { useStudioBetaStore, type AutoMagicStage } from "@/lib/studio-beta/store";
import { estimateCostUsd } from "@/lib/ai-cost-rates";
import {
  estimateEngineCostUsd,
  getBackgroundEngine,
  isEngineAvailable,
  REALISM_ENGINE,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";
import { cn } from "@/lib/utils";

const STAGES: { id: AutoMagicStage; label: string }[] = [
  { id: "identify", label: "זיהוי" },
  { id: "cutout", label: "בידוד" },
  { id: "background", label: "רקע והרכבה" },
  { id: "realism", label: "ריאליזם" },
];

/**
 * "קסם אוטומטי" — מריץ את כל השרשרת בלחיצה אחת עם המנוע שנבחר בבורר.
 * פאס הריאליזם (ControlNet) רץ רק כאן, לא בזרימה הידנית.
 */
export function AutoMagicPanel({
  providers,
}: {
  providers: ProvidersConfigured;
}) {
  const sourceImageUrl = useStudioBetaStore((s) => s.sourceImageUrl);
  const autoMagic = useStudioBetaStore((s) => s.autoMagic);
  const backgroundEngine = useStudioBetaStore((s) => s.background.engine);
  const runAutoMagic = useStudioBetaStore((s) => s.runAutoMagic);

  if (!sourceImageUrl) return null;

  const engineDef = getBackgroundEngine(backgroundEngine);
  // הריאליזם דורש Replicate; אם המנוע הנבחר עצמו לא זמין — גם אין טעם להתחיל
  const available =
    providers.replicate &&
    Boolean(engineDef && isEngineAvailable(engineDef, providers));
  const loading = autoMagic.status === "loading";

  // אומדן עלות כולל: זיהוי (Gemini) + בידוד (Bria) + מנוע הרקע + ריאליזם
  const estimatedCostUsd =
    estimateCostUsd("gemini-3.5-flash", null) +
    estimateCostUsd("bria/remove-background", null) +
    (engineDef ? estimateEngineCostUsd(engineDef) : 0) +
    estimateEngineCostUsd(REALISM_ENGINE);

  const stageIndex = autoMagic.currentStage
    ? STAGES.findIndex((s) => s.id === autoMagic.currentStage)
    : -1;

  return (
    <div className="space-y-3 border border-gold/40 bg-gold/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-dark" />
          <span className="text-sm font-light tracking-wide">קסם אוטומטי</span>
          <CostBadge costUsd={estimatedCostUsd} />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!available || loading}
          onClick={() => void runAutoMagic()}
        >
          {loading ? (
            <>
              <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
              רץ...
            </>
          ) : (
            "הרץ הכל בלחיצה אחת"
          )}
        </Button>
      </div>

      <p className="text-[11px] font-light text-muted-foreground">
        זיהוי, בידוד, רקע ({engineDef?.label ?? backgroundEngine}) והרכבה, ולבסוף
        פאס ריאליזם שמוסיף צל והשתקפויות טבעיים.
      </p>

      {(loading || autoMagic.status === "done" || autoMagic.status === "error") && (
        <ol className="flex flex-wrap items-center gap-2">
          {STAGES.map((stage, i) => {
            const isActive = loading && stage.id === autoMagic.currentStage;
            const isDone =
              autoMagic.status === "done" ||
              (stageIndex >= 0 && i < stageIndex) ||
              (autoMagic.status === "error" && stageIndex >= 0 && i < stageIndex);
            const isError =
              autoMagic.status === "error" && stage.id === autoMagic.currentStage;
            return (
              <li
                key={stage.id}
                className={cn(
                  "flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-light tracking-wide",
                  isActive && "border-gold bg-gold/10 text-gold-dark",
                  isDone && "border-border/60 text-foreground",
                  isError && "border-destructive/60 text-destructive",
                  !isActive && !isDone && !isError && "border-border/40 text-muted-foreground"
                )}
              >
                {isActive ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : isDone ? (
                  <Check className="h-3 w-3" />
                ) : isError ? (
                  <X className="h-3 w-3" />
                ) : null}
                {stage.label}
              </li>
            );
          })}
        </ol>
      )}

      {autoMagic.status === "error" && autoMagic.error && (
        <p className="text-[11px] font-light text-destructive">{autoMagic.error}</p>
      )}
      {!providers.replicate && (
        <p className="text-[11px] font-light text-muted-foreground">
          הקסם האוטומטי דורש Replicate מוגדר (פאס הריאליזם).
        </p>
      )}
    </div>
  );
}
