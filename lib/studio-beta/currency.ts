export type StudioCurrency = "usd" | "ils";

/** נופלים לזה רק אם קריאת השער החי (lib/studio-beta/exchange-rate.ts) עוד לא חזרה */
export const FALLBACK_ILS_PER_USD = 3.7;

export function formatStudioCost(
  costUsd: number,
  currency: StudioCurrency,
  ilsPerUsd: number = FALLBACK_ILS_PER_USD
): string {
  if (currency === "ils") {
    return `₪${(costUsd * ilsPerUsd).toFixed(2)}`;
  }
  return `$${costUsd.toFixed(3)}`;
}
