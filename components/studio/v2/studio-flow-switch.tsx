"use client";

import { Clapperboard, ImageIcon } from "lucide-react";

import type { StudioFlow } from "@/lib/studio-client/state";
import { cn } from "@/lib/utils";

const FLOWS: {
  id: StudioFlow;
  label: string;
  description: string;
  icon: typeof ImageIcon;
}[] = [
  {
    id: "catalog",
    label: "תמונת קטלוג",
    description: "רקע מעוצב לתכשיט — חינם ברובו",
    icon: ImageIcon,
  },
  {
    id: "marketing",
    label: "סרטון / תמונת שיווק",
    description: "וידאו ורקעי AI — בתשלום",
    icon: Clapperboard,
  },
];

export function StudioFlowSwitch({
  flow,
  onChange,
  disabled,
}: {
  flow: StudioFlow;
  onChange: (flow: StudioFlow) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="סוג תוכן">
      {FLOWS.map((item) => {
        const Icon = item.icon;
        const active = flow === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 border px-3 py-2.5 text-center transition-colors disabled:opacity-50",
              active
                ? "border-gold bg-gold/10 text-foreground"
                : "border-border/60 bg-background text-muted-foreground hover:border-gold/40"
            )}
          >
            <span className="flex items-center gap-1.5 text-sm font-light">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
            <span className="text-[10px] font-light text-muted-foreground">
              {item.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
