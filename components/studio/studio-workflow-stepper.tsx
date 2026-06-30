"use client";

import { Check } from "lucide-react";

export type StudioWorkflowStep = 1 | 2 | 3 | 4;

const STEPS: { id: StudioWorkflowStep; label: string; hint: string }[] = [
  { id: 1, label: "העלאה", hint: "צילום גולמי" },
  { id: 2, label: "סגנון", hint: "רקע ותאורה" },
  { id: 3, label: "יצירה", hint: "תמונה / וידאו" },
  { id: 4, label: "פרסום", hint: "שמירה ופרסום" },
];

export const EDIT_VIDEO_WORKFLOW_STEPS: {
  id: StudioWorkflowStep;
  label: string;
  hint: string;
}[] = [
  { id: 1, label: "העלאה", hint: "וידאו מהמחשב" },
  { id: 2, label: "עריכה", hint: "חיתוך ומיטוב" },
  { id: 3, label: "שמירה", hint: "Cloudinary" },
  { id: 4, label: "ספרייה", hint: "תוכן AI" },
];

export function StudioWorkflowStepper({
  current,
  onSelect,
  canSelect,
  steps = STEPS,
}: {
  current: StudioWorkflowStep;
  onSelect: (step: StudioWorkflowStep) => void;
  canSelect: (step: StudioWorkflowStep) => boolean;
  steps?: { id: StudioWorkflowStep; label: string; hint: string }[];
}) {
  return (
    <nav
      aria-label="שלבי הסטודיו"
      className="border border-border/60 bg-muted/20 px-3 py-4 sm:px-5"
    >
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const enabled = canSelect(step.id);
          const isCurrent = current === step.id;
          const isComplete = current > step.id;

          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                disabled={!enabled}
                onClick={() => enabled && onSelect(step.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex w-full items-start gap-2 border px-3 py-2.5 text-right transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                  isCurrent
                    ? "border-gold bg-gold/10 text-gold-dark"
                    : isComplete
                      ? "border-emerald-200/80 bg-emerald-50/40 text-emerald-900"
                      : "border-border/50 bg-background text-muted-foreground hover:border-gold/40 hover:text-foreground"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-light ${
                    isComplete
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "bg-gold text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                  aria-hidden
                >
                  {isComplete ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  ) : (
                    step.id
                  )}
                </span>
                <span className="min-w-0 text-right">
                  <span className="block text-xs font-light tracking-[0.08em]">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] font-light text-muted-foreground">
                    {step.hint}
                  </span>
                </span>
              </button>
              {index < steps.length - 1 && (
                <span className="sr-only">ואז</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
