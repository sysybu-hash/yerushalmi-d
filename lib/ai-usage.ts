import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { getSiteSettings } from "@/lib/site-settings";
import { and, count, eq, gte, sql } from "drizzle-orm";

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

export async function assertStudioQuota(
  capability: AiUsageCapability
): Promise<void> {
  const settings = await getSiteSettings();
  const today = startOfToday();

  if (capability === "video") {
    const limit = parseInt(settings.studioDailyVideoLimit || "0", 10);
    if (!limit || limit <= 0) return;

    const [row] = await db
      .select({ total: count() })
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.capability, "video"),
          eq(aiUsageEvents.success, true),
          eq(aiUsageEvents.cached, false),
          gte(aiUsageEvents.createdAt, today)
        )
      );

    if ((row?.total ?? 0) >= limit) {
      throw new QuotaExceededError(
        "הגעתם למכסה היומית לווידאו — נסו מחר או השתמשו בעריכה ללא AI"
      );
    }
    return;
  }

  if (capability === "cutout" || capability === "background") {
    const limit = parseInt(settings.studioDailyImageLimit || "0", 10);
    if (!limit || limit <= 0) return;

    const [row] = await db
      .select({ total: count() })
      .from(aiUsageEvents)
      .where(
        and(
          sql`${aiUsageEvents.capability} IN ('cutout', 'background')`,
          eq(aiUsageEvents.success, true),
          eq(aiUsageEvents.cached, false),
          gte(aiUsageEvents.createdAt, today)
        )
      );

    if ((row?.total ?? 0) >= limit) {
      throw new QuotaExceededError(
        "הגעתם למכסה היומית לתמונות AI — נסו מחר או השתמשו ברקע פרוצדורלי"
      );
    }
  }
}

export function extractReplicatePredictTime(output: unknown): number | null {
  if (!output || typeof output !== "object") return null;
  const metrics = (output as { metrics?: { predict_time?: number } }).metrics;
  if (metrics?.predict_time != null) return metrics.predict_time;
  return null;
}
