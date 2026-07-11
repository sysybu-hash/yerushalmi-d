"use client";

import { CostBadge } from "@/components/studio-beta/cost-badge";
import { cn } from "@/lib/utils";
import {
  isEngineAvailable,
  type EngineDef,
  type ProvidersConfigured,
} from "@/lib/studio-beta/engines";

/**
 * בורר מנוע/מודל ידני — יכולת ה-power-user המרכזית של סטודיו בטא.
 * תמיד גלוי, אין ברירת מחדל "אוטומטי" מוסתרת.
 */
export function EnginePicker({
  engines,
  estimateCost,
  value,
  onChange,
  providers,
}: {
  engines: EngineDef[];
  estimateCost: (engine: EngineDef) => number;
  value: string;
  onChange: (id: string) => void;
  providers: ProvidersConfigured;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {engines.map((engine) => {
        const configured = isEngineAvailable(engine, providers);
        const selected = engine.id === value;
        return (
          <button
            key={engine.id}
            type="button"
            disabled={!configured}
            title={
              configured
                ? undefined
                : `${engine.label} אינו מוגדר במערכת (חסר מפתח API)`
            }
            onClick={() => onChange(engine.id)}
            className={cn(
              "flex flex-col items-start gap-1 border px-3 py-2.5 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              selected
                ? "border-gold bg-gold/10"
                : "border-border/60 hover:border-gold/60"
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="text-sm font-light">{engine.label}</span>
              <CostBadge costUsd={estimateCost(engine)} />
            </div>
            <span className="text-[11px] font-light leading-relaxed text-muted-foreground">
              {engine.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
