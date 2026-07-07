"use client";

/** צ'יפ עלות ליד כל פעולה — שקיפות מלאה לפני לחיצה */
export function StudioCostChip({
  label,
  free,
}: {
  label?: string;
  free?: boolean;
}) {
  if (free) {
    return (
      <span className="inline-flex items-center border border-emerald-600/30 bg-emerald-600/10 px-2 py-0.5 text-[10px] font-light tracking-wide text-emerald-700">
        חינם
      </span>
    );
  }
  return (
    <span className="inline-flex items-center border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-light tracking-wide text-gold-dark" dir="ltr">
      {label}
    </span>
  );
}

/** עלויות משוערות לתצוגה — מבוסס lib/ai-cost-rates.ts */
export const STUDIO_COST_LABELS = {
  cutout: "$0.004~",
  aiBackground: "$0.01–0.02~",
  aiVideo: "$0.35–0.61~",
} as const;
