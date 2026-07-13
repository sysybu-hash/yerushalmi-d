import Replicate from "replicate";
import { StudioBetaError, mapProviderError } from "@/lib/studio-beta/errors";

let client: Replicate | null = null;

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

export function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      "REPLICATE_API_TOKEN לא מוגדר — לא ניתן להשתמש במנועי Replicate"
    );
  }
  if (!client) {
    client = new Replicate({ auth: token });
  }
  return client;
}

export type ReplicateRunResult = {
  output: unknown;
  /** משך ריצה אמיתי בשניות (metrics.predict_time) — לכיול עלות מדויק, לא flat */
  predictTimeSec: number | null;
};

/** מריץ מודל Replicate ומטפל בשגיאות ספק כהודעת עברית ברורה */
export async function runReplicateModel(
  model: `${string}/${string}` | `${string}/${string}:${string}`,
  input: Record<string, unknown>
): Promise<ReplicateRunResult> {
  const replicate = getReplicateClient();
  let predictTimeSec: number | null = null;
  try {
    const output = await replicate.run(model, { input }, (prediction) => {
      if (prediction.metrics?.predict_time != null) {
        predictTimeSec = prediction.metrics.predict_time;
      }
    });
    return { output, predictTimeSec };
  } catch (error) {
    throw mapProviderError("Replicate", error);
  }
}
