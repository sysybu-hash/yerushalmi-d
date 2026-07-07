import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { getSiteSettings } from "@/lib/site-settings";
import { and, count, eq, sql } from "drizzle-orm";

export type AiUsageCapability =
  | "cutout"
  | "background"
  | "video"
  | "vision"
  | "text";

export type AiUsageProvider = "replicate" | "gemini";
export type AiUsageMode = "catalog" | "marketing" | "listing";

export type TrackAiUsageInput = {
  provider: AiUsageProvider;
  capability: AiUsageCapability;
  modelId: string;
  mode?: AiUsageMode;
  success: boolean;
  durationMs?: number;
  billedUnits?: number | null;
  cached?: boolean;
  projectId?: number | null;
  metadata?: Record<string, unknown>;
};

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export async function trackAiUsage(input: TrackAiUsageInput): Promise<void> {
  const estimatedCostUsd = input.cached
    ? 0
    : estimateCostUsd(input.modelId, input.billedUnits ?? null);

  try {
    await db.insert(aiUsageEvents).values({
      provider: input.provider,
      capability: input.capability,
      modelId: input.modelId,
      mode: input.mode ?? "catalog",
      success: input.success,
      durationMs: input.durationMs ?? null,
      estimatedCostUsd: estimatedCostUsd.toFixed(6),
      billedUnits:
        input.billedUnits != null ? String(input.billedUnits) : null,
      cached: input.cached ?? false,
      projectId: input.projectId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("ai_usage_track_failed", error);
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const QUOTA_RESERVATION_MODEL = "quota-reservation";
/** שריון pending שלא שוחרר (קריסה) פג אחרי 10 דקות */
const RESERVATION_TTL_MS = 10 * 60 * 1000;

export type QuotaReservation = { release: () => Promise<void> };

const NOOP_RESERVATION: QuotaReservation = { release: async () => {} };

function quotaScope(capability: AiUsageCapability): {
  capabilities: AiUsageCapability[];
  limitKey: "studioDailyVideoLimit" | "studioDailyImageLimit";
  message: string;
} | null {
  if (capability === "video") {
    return {
      capabilities: ["video"],
      limitKey: "studioDailyVideoLimit",
      message: "הגעתם למכסה היומית לווידאו — נסו מחר או השתמשו בעריכה ללא AI",
    };
  }
  if (capability === "cutout" || capability === "background") {
    return {
      capabilities: ["cutout", "background"],
      limitKey: "studioDailyImageLimit",
      message:
        "הגעתם למכסה היומית לתמונות AI — נסו מחר או השתמשו ברקע פרוצדורלי",
    };
  }
  return null;
}

/**
 * בדיקת מכסה עמידה למרוץ (Neon HTTP — בלי טרנזקציות):
 * מכניסים שורת שריון pending ואז סופרים; אם עברנו את המכסה —
 * מוחקים את השריון וזורקים. שתי בקשות מקבילות לא יעברו יחד את הגבול.
 * חובה לקרוא release() ב-finally אחרי שהאירוע האמיתי נרשם.
 */
export async function reserveStudioQuota(
  capability: AiUsageCapability
): Promise<QuotaReservation> {
  const scope = quotaScope(capability);
  if (!scope) return NOOP_RESERVATION;

  const settings = await getSiteSettings();
  const limit = parseInt(settings[scope.limitKey] || "0", 10);
  if (!limit || limit <= 0) return NOOP_RESERVATION;

  const today = startOfToday();
  const reservedSince = new Date(Date.now() - RESERVATION_TTL_MS);
  const capabilityList = sql.join(
    scope.capabilities.map((c) => sql`${c}`),
    sql`, `
  );

  const [reserved] = await db
    .insert(aiUsageEvents)
    .values({
      provider: "replicate",
      capability,
      modelId: QUOTA_RESERVATION_MODEL,
      mode: "catalog",
      success: false,
      cached: true,
      estimatedCostUsd: "0",
      metadata: { pending: true },
    })
    .returning({ id: aiUsageEvents.id });

  const release: QuotaReservation["release"] = async () => {
    if (!reserved?.id) return;
    try {
      await db.delete(aiUsageEvents).where(eq(aiUsageEvents.id, reserved.id));
    } catch (error) {
      console.error("ai_quota_release_failed", error);
    }
  };

  const [row] = await db
    .select({ total: count() })
    .from(aiUsageEvents)
    .where(
      and(
        sql`${aiUsageEvents.capability} IN (${capabilityList})`,
        sql`(
          (${aiUsageEvents.success} = true AND ${aiUsageEvents.cached} = false AND ${aiUsageEvents.createdAt} >= ${today})
          OR
          (${aiUsageEvents.modelId} = ${QUOTA_RESERVATION_MODEL} AND ${aiUsageEvents.createdAt} >= ${reservedSince})
        )`
      )
    );

  // הספירה כוללת את השריון של עצמנו, לכן ההשוואה היא > ולא >=
  if ((row?.total ?? 0) > limit) {
    await release();
    throw new QuotaExceededError(scope.message);
  }

  return { release };
}

export function extractReplicatePredictTime(output: unknown): number | null {
  if (!output || typeof output !== "object") return null;
  const metrics = (output as { metrics?: { predict_time?: number } }).metrics;
  if (metrics?.predict_time != null) return metrics.predict_time;
  return null;
}
