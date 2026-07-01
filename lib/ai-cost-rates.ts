export type AiCostBillingType = "per_second" | "per_call" | "per_1m_tokens";

export type AiCostRate = {
  billing: AiCostBillingType;
  /** USD per billing unit */
  rateUsd: number;
  /** flat fallback when metrics unavailable */
  flatUsd?: number;
};

/** תעריפים משוערים — עדכנו לפי Replicate / Google AI Studio */
export const AI_COST_RATES: Record<string, AiCostRate> = {
  "bria/remove-background": {
    billing: "per_second",
    rateUsd: 0.0018,
    flatUsd: 0.004,
  },
  "black-forest-labs/flux-schnell": {
    billing: "per_second",
    rateUsd: 0.003,
    flatUsd: 0.006,
  },
  "stability-ai/sdxl": {
    billing: "per_second",
    rateUsd: 0.004,
    flatUsd: 0.012,
  },
  "kwaivgi/kling-v3-video": {
    billing: "per_call",
    rateUsd: 0.35,
    flatUsd: 0.35,
  },
  "lucataco/ollama-llama3.3-70b": {
    billing: "per_second",
    rateUsd: 0.0008,
    flatUsd: 0.002,
  },
  "lucataco/moondream2": {
    billing: "per_call",
    rateUsd: 0.002,
    flatUsd: 0.002,
  },
  "yorickvp/llava-13b": {
    billing: "per_call",
    rateUsd: 0.005,
    flatUsd: 0.005,
  },
  "gemini-3.5-flash": {
    billing: "per_1m_tokens",
    rateUsd: 0.15,
    flatUsd: 0.001,
  },
  "gemini-3.1-flash-image": {
    billing: "per_call",
    rateUsd: 0.02,
    flatUsd: 0.02,
  },
  "gemini-3.1-flash-image-preview": {
    billing: "per_call",
    rateUsd: 0.02,
    flatUsd: 0.02,
  },
  "veo-3.1-fast-generate-preview": {
    billing: "per_call",
    rateUsd: 0.4,
    flatUsd: 0.4,
  },
  "veo-3.1-generate-preview": {
    billing: "per_call",
    rateUsd: 0.6,
    flatUsd: 0.6,
  },
};

export function normalizeModelKey(modelId: string): string {
  const base = modelId.split(":")[0] ?? modelId;
  return base;
}

export function estimateCostUsd(
  modelId: string,
  billedUnits?: number | null
): number {
  const key = normalizeModelKey(modelId);
  const rate = AI_COST_RATES[key];
  if (!rate) return 0;

  if (billedUnits == null || !Number.isFinite(billedUnits)) {
    return rate.flatUsd ?? 0;
  }

  switch (rate.billing) {
    case "per_second":
      return billedUnits * rate.rateUsd;
    case "per_1m_tokens":
      return (billedUnits / 1_000_000) * rate.rateUsd;
    case "per_call":
      return rate.rateUsd;
    default:
      return rate.flatUsd ?? 0;
  }
}
