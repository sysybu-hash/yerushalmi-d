import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";

const SETTING_KEY = "studioUsdToIlsRate";
const FALLBACK_RATE = 3.7;
const STALE_MS = 12 * 60 * 60 * 1000; // מרעננים לכל היותר פעם ב-12 שעות

async function fetchLiveRate(): Promise<number | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { rates?: Record<string, number> };
    const rate = json.rates?.ILS;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

/**
 * שער דולר→שקל בפועל, לא קבוע — מתעדכן מ-API חיצוני חינמי (open.er-api.com)
 * לכל היותר פעם ב-12 שעות, נשמר ב-site_settings.studioUsdToIlsRate. אם
 * הקריאה החיצונית נכשלת, ממשיכים עם השער האחרון הידוע (לא זורקים).
 */
export async function getUsdToIlsRate(): Promise<number> {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SETTING_KEY));

  const cachedRate = row ? Number(row.value) : null;
  const isStale =
    !row || Date.now() - row.updatedAt.getTime() > STALE_MS;

  if (!isStale && cachedRate && cachedRate > 0) {
    return cachedRate;
  }

  const liveRate = await fetchLiveRate();
  if (liveRate) {
    await db
      .insert(siteSettings)
      .values({ key: SETTING_KEY, value: String(liveRate) })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: String(liveRate), updatedAt: new Date() },
      });
    return liveRate;
  }

  return cachedRate && cachedRate > 0 ? cachedRate : FALLBACK_RATE;
}
