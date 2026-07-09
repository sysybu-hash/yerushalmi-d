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
 * קובע את הפעולה הבאה ההגיונית לפי מצב הצינור והזרימה.
 */
export function resolveNextAction(state: StudioV2State): NextAction | null {
  if (!state.source.url) return null;

  const previewReady =
    state.preview.url && state.preview.presetId === state.stylePreset;
  const hasCatalogResult =
    state.result.url && state.result.kind === "image" && previewReady;

  if (state.flow === "catalog") {
    if (hasCatalogResult) return null;

    if (state.useAiBackground && previewReady) {
      return {
        id: "image",
        label: "יצירת תמונה עם רקע AI",
        hint: "רקע גנרטיבי — קריאת AI בתשלום",
        free: false,
        costLabel: STUDIO_COST_LABELS.aiBackground,
        icon: Sparkles,
      };
    }

    const hasCutout = Boolean(state.cutout.url);
    return {
      id: "preview",
      label: hasCutout
        ? "יצירת תמונת קטלוג"
        : "בידוד + יצירת תמונת קטלוג",
      hint: hasCutout
        ? "הרכבה פרוצדורלית על הרקע הנבחר"
        : "בידוד (~₪0.02) + הרכבה חינם. נשמר במטמון — לא יחויב שוב",
      free: hasCutout,
      costLabel: hasCutout ? undefined : STUDIO_COST_LABELS.cutout,
      icon: Wand2,
    };
  }

  // שיווק — וידאו כצעד ראשי כשיש בסיס שמיש
  const hasUsableBase = Boolean(
    (state.result.kind === "image" && state.result.url) ||
      state.preview.url ||
      (state.source.kind === "image" && state.source.url) ||
      (state.source.kind === "video" && state.source.url)
  );

  if (!hasUsableBase) {
    return {
      id: "preview",
      label: "בידוד + עיצוב רקע",
      hint: "נדרש לפני וידאו — אין תמונת בסיס שמישה",
      free: false,
      costLabel: STUDIO_COST_LABELS.cutout,
      icon: Wand2,
    };
  }

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
      state.videoMotion === "preserve" ? undefined : STUDIO_COST_LABELS.aiVideo,
    icon: Clapperboard,
  };
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
          הצעד הבא
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
