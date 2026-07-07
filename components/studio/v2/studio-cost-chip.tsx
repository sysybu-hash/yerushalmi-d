"use client";

/** שער המרה משוער לתצוגה בלבד — העלויות בפועל נגבות בדולר */
export const ILS_PER_USD = 3.7;

export function usdToIls(usd: number): string {
  const ils = usd * ILS_PER_USD;
  return `₪${ils < 1 ? ils.toFixed(2) : ils.toFixed(1)}~`;
}

export function usdRangeToIls(minUsd: number, maxUsd: number): string {
  return `₪${(minUsd * ILS_PER_USD).toFixed(1)}–${(maxUsd * ILS_PER_USD).toFixed(1)}~`;
}

/** צ'יפ עלות ליד כל פעולה — שקיפות מלאה לפני לחיצה, בשקלים */
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
    <span
      className="inline-flex items-center border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-light tracking-wide text-gold-dark"
      dir="ltr"
    >
      {label}
    </span>
  );
}

/** עלויות משוערות לתצוגה בשקלים — מבוסס lib/ai-cost-rates.ts */
export const STUDIO_COST_LABELS = {
  cutout: usdToIls(0.004),
  aiBackground: usdRangeToIls(0.01, 0.02),
  aiVideo: usdRangeToIls(0.35, 0.61),
  sourceEnhance: usdToIls(0.02),
  videoEnhanceAi: usdRangeToIls(0.4, 0.6),
} as const;
