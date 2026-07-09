"use client";

import type { ReactNode } from "react";
import type { StudioV2State } from "@/lib/studio-client/state";
import { deriveStudioStep } from "@/lib/studio-client/state";
import { cn } from "@/lib/utils";

const CATALOG_STEPS = [
  "העלאה",
  "בחירת רקע",
  "יצירת תמונה",
  "שמירה לספרייה",
] as const;

const MARKETING_STEPS = [
  "העלאה",
  "בחירת רקע",
  "יצירת וידאו",
  "שמירה לספרייה",
] as const;

export function StudioWorkflowSteps({
  state,
}: {
  state: StudioV2State;
}) {
  const step = deriveStudioStep(state);
  const labels = state.flow === "catalog" ? CATALOG_STEPS : MARKETING_STEPS;

  return (
    <ol className="grid grid-cols-4 gap-1 border border-border/50 bg-muted/20 p-2">
      {labels.map((label, index) => {
        const n = (index + 1) as 1 | 2 | 3 | 4;
        const active = step === n;
        const done = step > n;
        return (
          <li
            key={label}
            className={cn(
              "flex flex-col items-center gap-0.5 px-1 py-1 text-center text-[10px] font-light",
              active && "bg-gold/15 text-foreground",
              done && "text-gold-dark",
              !active && !done && "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                active && "border-gold bg-gold text-black",
                done && "border-gold/60 bg-gold/20",
                !active && !done && "border-border/60"
              )}
            >
              {n}
            </span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function StudioStepSection({
  step,
  currentStep,
  title,
  children,
}: {
  step: 1 | 2 | 3 | 4;
  currentStep: 1 | 2 | 3 | 4;
  title: string;
  children: ReactNode;
}) {
  if (step === 4 && currentStep < 4) return null;
  if (step === 1 && currentStep > 1) return null;
  if ((step === 2 || step === 3) && currentStep >= 4) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-light tracking-[0.12em] text-muted-foreground">
        שלב {step} — {title}
      </p>
      {children}
    </div>
  );
}
