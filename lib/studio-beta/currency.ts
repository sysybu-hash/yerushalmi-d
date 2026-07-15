export type StudioCurrency = "usd" | "ils";

/** שער קבוע — תואם ל-site_settings.studioUsdToIlsRate ההיסטורי */
export const ILS_PER_USD = 3.7;

export function formatStudioCost(
  costUsd: number,
  currency: StudioCurrency
): string {
  if (currency === "ils") {
    return `₪${(costUsd * ILS_PER_USD).toFixed(2)}`;
  }
  return `$${costUsd.toFixed(3)}`;
}
