import { and, count, eq, ne, sql, sum } from "drizzle-orm";

import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** מד שימוש יומי לסטודיו — מידע בלבד (ללא מכסות), קריאה בלבד, ללא עלות */
export async function GET() {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    // "היום" נמדד בשעון ה-DB (לא new Date() ב-Node) — נמנע מפער שעון
    // בין שרת האפליקציה לשרת ה-DB
    const realCallsToday = and(
      sql`${aiUsageEvents.createdAt} >= date_trunc('day', now())`,
      eq(aiUsageEvents.success, true),
      eq(aiUsageEvents.cached, false),
      ne(aiUsageEvents.modelId, "quota-reservation")
    );

    const [[images], [videos], [cost]] = await Promise.all([
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
      videosToday: videos?.total ?? 0,
      costTodayUsd: Number(cost?.total ?? 0),
    });
  } catch (error) {
    return studioJsonError(error, "טעינת נתוני השימוש נכשלה");
  }
}
