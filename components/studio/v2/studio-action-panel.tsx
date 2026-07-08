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
 * הבידוד (cutout) אינו שלב חובה — הוא נחוץ רק אם רוצים להרכיב את
 * התכשיט על רקע מעוצב חדש (זרימת קטלוג) או לעצב רקע/סגנון לפני וידאו.
 * אם יש כבר תוצאה/מקור שמישים, אפשר לדלג ישר לווידאו או לפרסום —
 * ר' כפתור "עבודה ישירה מהתמונה" ב-page.tsx.
 */
export function resolveNextAction(state: StudioV2State): NextAction | null {
  if (!state.source.url) return null;

  const previewReady =
    state.preview.url && state.preview.presetId === state.stylePreset;
  const hasUsableBase = Boolean(
    (state.result.kind === "image" && state.result.url) ||
      state.preview.url ||
      (state.source.kind === "image" && state.source.url)
  );

  if (state.flow === "catalog") {
    // מסתירים את הכפתור רק אם באמת אין מה לעדכן — יש תוצאה סופית
    // *וגם* התצוגה המקדימה תואמת לסגנון הנבחר כרגע. אם המשתמש בחר
    // סגנון רקע חדש, previewReady הופך ל-false וצריך להציע שוב פעולה.
    if (state.result.url && state.result.kind === "image" && previewReady) {
      return null;
    }
    if (!previewReady) {
      return {
        id: "preview",
        label: state.cutout.url
          ? "תצוגה מקדימה בסגנון הנבחר"
          : "בידוד התכשיט + תצוגה מקדימה",
        hint: state.cutout.url
          ? "הרכבה פרוצדורלית — ללא קריאת AI"
          : "בידוד בתשלום זעום, ההרכבה חינם. נשמר במטמון — לא יחויב שוב",
        free: Boolean(state.cutout.url),
        costLabel: state.cutout.url ? undefined : STUDIO_COST_LABELS.cutout,
        icon: Wand2,
      };
    }
    return {
      id: "image",
      label: state.useAiBackground
        ? "יצירת תמונה עם רקע AI"
        : "אישור התמונה כתוצאה סופית",
      hint: state.useAiBackground
        ? "רקע גנרטיבי — קריאת AI בתשלום"
        : "התצוגה המקדימה היא התוצאה — ללא עלות נוספת",
      free: !state.useAiBackground,
      costLabel: state.useAiBackground
        ? STUDIO_COST_LABELS.aiBackground
        : undefined,
      icon: Sparkles,
    };
  }

  // שיווק — וידאו. אין חובת בידוד/תצוגה מקדימה: אם יש מקור או תוצאה
  // שמישים, אפשר ליצור וידאו ישירות מהם. לא מסתירים את הכפתור גם אם
  // כבר נוצר וידאו קודם — צריך אפשרות ליצור עוד וידאו עם הגדרות חדשות
  // (משך/תנועה/מנוע שונים), אחרת אין דרך ליצור וידאו שני מאותו פרויקט.
  if (!hasUsableBase) {
    return {
      id: "preview",
      label: "בידוד התכשיט + תצוגה מקדימה",
      hint: "אופציונלי — נועד לעצב רקע חדש לפני הווידאו. אפשר גם לדלג ולעבוד ישירות מהתמונה (למטה)",
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
