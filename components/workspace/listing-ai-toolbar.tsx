"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ListingAiToolbarProps = {
  aiPending: "fill" | "refine" | null;
  canFill: boolean;
  canRefine: boolean;
  disabled?: boolean;
  notice?: string | null;
  onFill: () => void;
  onRefine: () => void;
};

export function ListingAiToolbar({
  aiPending,
  canFill,
  canRefine,
  disabled = false,
  notice,
  onFill,
  onRefine,
}: ListingAiToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || aiPending !== null || !canFill}
          onClick={onFill}
          className="rounded-none text-xs font-light tracking-wide"
        >
          {aiPending === "fill" ? (
            <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          מילוי אוטומטי עם AI
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || aiPending !== null || !canRefine}
          onClick={onRefine}
          className="rounded-none text-xs font-light tracking-wide"
        >
          {aiPending === "refine" ? (
            <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          שפר ומטב
        </Button>
      </div>
      {notice && (
        <p className="text-xs font-light text-emerald-700">{notice}</p>
      )}
    </div>
  );
}
