"use client";

import { Loader2, Sparkles, Wand2, Clapperboard } from "lucide-react";

import type { StudioV2State } from "@/lib/studio-client/state";
import { Button } from "@/components/ui/button";
import { StudioCostChip, STUDIO_COST_LABELS } from "./studio-cost-chip";

type NextAction = {
  id: "preview" | "image" | "video";
  label: string;
  hint: string;
  free: boolean;
  costLabel?: string;
  icon: typeof Sparkles;
};

/**
 * פעולה אחת לקטלוג/שיווק — בידוד + הרכבה + רקע (פרוצדורלי או AI).
 * בשיווק: קודם תמונה מעוצבת, אחר כך וידאו.
 */
export function resolveNextAction(state: StudioV2State): NextAction | null {
  if (!state.source.url) return null;

  const hasImageResult =
    state.result.url && state.result.kind === "image";
  const hasCutout = Boolean(state.cutout.url);
  const useAi = state.useAiBackground;

  if (state.flow === "catalog" || state.flow === "marketing") {
    if (hasImageResult && state.flow === "marketing") {
      return {
        id: "video",
        label:
          state.videoMotion === "preserve"
            ? "יצירת וידאו זום עדין"
            : "יצירת וידאו AI קולנועי",
        hint:
          state.videoMotion === "preserve"
            ? "Cloudinary zoompan — ללא קריאת AI"
            : "Kling / Veo — הפעולה היקרה ביותר; נדרש אישור",
        free: state.videoMotion === "preserve",
        costLabel:
          state.videoMotion === "preserve"
            ? undefined
            : STUDIO_COST_LABELS.aiVideo,
        icon: Clapperboard,
      };
    }

    if (hasImageResult && state.flow === "catalog") return null;

    return {
      id: "image",
      label: useAi
        ? hasCutout
          ? state.flow === "marketing"
            ? "יצירת תמונת בסיס (רקע AI)"
            : "יצירת תמונה (רקע AI)"
          : state.flow === "marketing"
            ? "בידוד + תמונת בסיס (רקע AI)"
            : "בידוד + יצירת תמונה (רקע AI)"
        : hasCutout
          ? state.flow === "marketing"
            ? "יצירת תמונת בסיס לוידאו"
            : "יצירת תמונת קטלוג"
          : state.flow === "marketing"
            ? "בידוד + תמונת בסיס לוידאו"
            : "בידוד + יצירת תמונת קטלוג",
      hint:
        state.flow === "marketing"
          ? "לאחר יצירת התמונה יופיע כאן כפתור נוסף ליצירת הוידאו"
          : useAi
            ? "פעולה אחת — בידוד, עיצוב והרכבה על רקע AI"
            : "פעולה אחת — בידוד והרכבה פרוצדורלית (חינם)",
      free: !useAi && hasCutout,
      costLabel: useAi
        ? STUDIO_COST_LABELS.aiBackground
        : hasCutout
          ? undefined
          : STUDIO_COST_LABELS.cutout,
      icon: useAi ? Sparkles : Wand2,
    };
  }

  return null;
}

export function StudioActionPanel({
  state,
  onAction,
}: {
  state: StudioV2State;
  onAction: (id: NextAction["id"]) => void;
}) {
  const next = resolveNextAction(state);
  if (!next) return null;

  const Icon = next.icon;
  const busy = state.busyAction !== null;

  return (
    <div className="space-y-2 border border-gold/30 bg-gold/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-light tracking-[0.1em] text-muted-foreground">
          {next.id === "video" ? "שלב 3 — וידאו" : "שלב 3 — יצירה"}
        </p>
        <StudioCostChip free={next.free} label={next.costLabel} />
      </div>
      <Button
        onClick={() => onAction(next.id)}
        disabled={busy}
        className="w-full rounded-none bg-gold text-sm font-light text-black hover:bg-gold/90"
      >
        {busy ? (
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="ml-2 h-4 w-4" />
        )}
        {next.label}
      </Button>
      <p className="text-[11px] font-light text-muted-foreground">
        {next.hint}
      </p>
    </div>
  );
}
