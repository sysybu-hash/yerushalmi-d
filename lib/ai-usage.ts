import { db } from "@/db";
import { aiUsageEvents, studioQuotaCounters } from "@/db/schema";
import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { getSiteSettings } from "@/lib/site-settings";
import { sql } from "drizzle-orm";

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

export type QuotaReservation = { release: () => Promise<void> };

const NOOP_RESERVATION: QuotaReservation = { release: async () => {} };

type QuotaScopeKey = "video" | "image";

function quotaScope(capability: AiUsageCapability): {
  scopeKey: QuotaScopeKey;
  limitKey: "studioDailyVideoLimit" | "studioDailyImageLimit";
  message: string;
} | null {
  if (capability === "video") {
    return {
      scopeKey: "video",
      limitKey: "studioDailyVideoLimit",
      message: "הגעתם למכסה היומית לווידאו — נסו מחר או השתמשו בעריכה ללא AI",
    };
  }
  if (capability === "cutout" || capability === "background") {
    return {
      scopeKey: "image",
      limitKey: "studioDailyImageLimit",
      message:
        "הגעתם למכסה היומית לתמונות AI — נסו מחר או השתמשו ברקע פרוצדורלי",
    };
  }
  return null;
}

/**
 * בדיקת מכסה עמידה לעומס אמיתי — מונה אטומי (studio_quota_counters)
 * עם UPSERT ‏`count = count + 1`. ספירת שורות ב-ai_usage_events (הגישה
 * הקודמת) נכשלה בבדיקת עומס: Postgres CTE אחיות (insert+select באותה
 * שאילתה) לא רואות זו את זו, אז עדיין הוחמצו שריונים במקביל אמיתי
 * (8 עברו במקום 5). UPDATE אטומי על שורה יחידה נעול ע"י Postgres —
 * מבטיח ספירה מדויקת גם תחת עשרות בקשות מקבילות באותה מילישנייה.
 * "היום" הוא current_date בשרת ה-DB (לא new Date() ב-Node) — נמנע
 * מפער שעון (clock skew) בין שרת האפליקציה לשרת ה-DB.
 */
export async function reserveStudioQuota(
  capability: AiUsageCapability
): Promise<QuotaReservation> {
  const scope = quotaScope(capability);
  if (!scope) return NOOP_RESERVATION;

  const settings = await getSiteSettings();
  const limit = parseInt(settings[scope.limitKey] || "0", 10);
  if (!limit || limit <= 0) return NOOP_RESERVATION;

  const result = await db.execute<{ count: number }>(sql`
    INSERT INTO ${studioQuotaCounters} (day, scope_key, count)
    VALUES (current_date, ${scope.scopeKey}, 1)
    ON CONFLICT (day, scope_key)
    DO UPDATE SET count = ${studioQuotaCounters.count} + 1
    RETURNING count
  `);
  const newCount =
    (result as unknown as { rows: { count: number }[] }).rows?.[0]?.count ?? 0;

  const release: QuotaReservation["release"] = async () => {
    try {
      await db.execute(sql`
        UPDATE ${studioQuotaCounters}
        SET count = GREATEST(0, count - 1)
        WHERE day = current_date AND scope_key = ${scope.scopeKey}
      `);
    } catch (error) {
      console.error("ai_quota_release_failed", error);
    }
  };

  if (newCount > limit) {
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
