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

/** מריץ מודל Replicate ומטפל בשגיאות ספק כהודעת עברית ברורה */
export async function runReplicateModel(
  model: `${string}/${string}` | `${string}/${string}:${string}`,
  input: Record<string, unknown>
): Promise<unknown> {
  const replicate = getReplicateClient();
  try {
    return await replicate.run(model, { input });
  } catch (error) {
    throw mapProviderError("Replicate", error);
  }
}
