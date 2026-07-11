"use client";

import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "העלאה" },
  { id: 2, label: "רקע" },
  { id: 3, label: "תמונה או וידאו" },
  { id: 4, label: "שמירה" },
] as const;

export function StepHeader({
  currentStep,
  maxStepReached = currentStep,
  onStepClick,
}: {
  currentStep: 1 | 2 | 3 | 4;
  maxStepReached?: 1 | 2 | 3 | 4;
  onStepClick?: (step: 1 | 2 | 3 | 4) => void;
}) {
  return (
    <ol className="flex items-center gap-2 text-xs font-light tracking-wide">
      {STEPS.map((step, index) => {
        const active = step.id === currentStep;
        const done = step.id < currentStep;
        const reachable = step.id <= maxStepReached;
        const clickable = Boolean(onStepClick) && reachable && !active;
        return (
          <li key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(step.id)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center border text-[11px]",
                  active
                    ? "border-gold bg-gold text-white"
                    : done
                    ? "border-gold/50 text-gold-dark"
                    : "border-border/60 text-muted-foreground",
                  clickable && "transition-colors hover:border-gold"
                )}
              >
                {step.id}
              </span>
              <span
                className={cn(
                  active ? "text-foreground" : "text-muted-foreground",
                  clickable && "transition-colors hover:text-foreground"
                )}
              >
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <span className="mx-1 h-px w-4 bg-border/60" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
