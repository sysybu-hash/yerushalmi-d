import { db } from "@/db";
import { aiUsageEvents } from "@/db/schema";
import { estimateCostUsd } from "@/lib/ai-cost-rates";

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

/**
 * מעקב שימוש בלבד — ללא מכסות. ההגנה היחידה מפני חיוב כפול היא
 * idempotency (studio-idempotency.ts) + נעילת busyAction בצד לקוח.
 * מכסות יומיות הוסרו במכוון: הן תקעו את העבודה (מונה שלא שוחרר אחרי
 * קריסה "אכל" סלוט עד חצות) בלי להוסיף הגנה אמיתית למפעיל יחיד.
 */
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

export function extractReplicatePredictTime(output: unknown): number | null {
  if (!output || typeof output !== "object") return null;
  const metrics = (output as { metrics?: { predict_time?: number } }).metrics;
  if (metrics?.predict_time != null) return metrics.predict_time;
  return null;
}
