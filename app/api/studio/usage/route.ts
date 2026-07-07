import { and, count, eq, gte, ne, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { getSiteSettings } from "@/lib/site-settings";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** מד שימוש יומי לסטודיו — קריאה בלבד, ללא עלות */
export async function GET() {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const realCallsToday = and(
      gte(aiUsageEvents.createdAt, today),
      eq(aiUsageEvents.success, true),
      eq(aiUsageEvents.cached, false),
      ne(aiUsageEvents.modelId, "quota-reservation")
    );

    const [settings, [images], [videos], [cost]] = await Promise.all([
      getSiteSettings(),
      db
        .select({ total: count() })
        .from(aiUsageEvents)
        .where(
          and(
            realCallsToday,
            sql`${aiUsageEvents.capability} IN ('cutout', 'background')`
          )
        ),
      db
        .select({ total: count() })
        .from(aiUsageEvents)
        .where(and(realCallsToday, eq(aiUsageEvents.capability, "video"))),
      db
        .select({ total: sum(aiUsageEvents.estimatedCostUsd) })
        .from(aiUsageEvents)
        .where(realCallsToday),
    ]);

    return studioJsonOk({
      imagesToday: images?.total ?? 0,
      imageLimit: parseInt(settings.studioDailyImageLimit || "0", 10) || 0,
      videosToday: videos?.total ?? 0,
      videoLimit: parseInt(settings.studioDailyVideoLimit || "0", 10) || 0,
      costTodayUsd: Number(cost?.total ?? 0),
    });
  } catch (error) {
    return studioJsonError(error, "טעינת נתוני השימוש נכשלה");
  }
}
