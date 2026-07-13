"use client";

import { Loader2, Sparkles } from "lucide-react";
import { CostBadge } from "@/components/studio-beta/cost-badge";
import { useStudioBetaStore } from "@/lib/studio-beta/store";

/** זיהוי תמונה ב-AI — תיאור חופשי בעברית, best-effort (Gemini→Replicate) */
export function IdentifyPanel() {
  const identify = useStudioBetaStore((s) => s.identify);
  const runIdentify = useStudioBetaStore((s) => s.runIdentify);

  const loading = identify.status === "loading";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-light text-muted-foreground">
          זיהוי תמונה ב-AI (אופציונלי) — תיאור חופשי של התכשיט
        </p>
        {identify.status === "done" && identify.costUsd > 0 && (
          <CostBadge costUsd={identify.costUsd} />
        )}
      </div>

      <button
        type="button"
        onClick={runIdentify}
        disabled={loading}
        className="flex items-center gap-1.5 border border-border/60 px-2.5 py-1.5 text-[11px] font-light text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        זהה תמונה ב-AI
      </button>

      {identify.status === "done" && identify.description && (
        <p className="border border-border/60 bg-secondary/30 p-2.5 text-xs font-light leading-relaxed text-foreground/80">
          {identify.description}
        </p>
      )}

      {identify.error && (
        <p className="text-[11px] font-light text-destructive">{identify.error}</p>
      )}
    </div>
  );
}
