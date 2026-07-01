import {
  type AiCapability,
  type AiEngineConfig,
  type AiEngineProvider,
  type AiResolvedProvider,
  assertEngineAvailable,
  mergeAiEngineConfig,
  aiEnginesFromSiteSettings,
  resolveEngine,
} from "@/lib/ai-engines";
import { getSiteSettings } from "@/lib/site-settings";

export type ResolvedAiEngines = {
  preferences: AiEngineConfig;
  vision: AiResolvedProvider;
  text: AiResolvedProvider;
  cutout: AiResolvedProvider;
  video: AiResolvedProvider;
};

export async function getResolvedAiEngines(
  overrides?: Partial<AiEngineConfig>
): Promise<ResolvedAiEngines> {
  const settings = await getSiteSettings();
  const preferences = mergeAiEngineConfig(
    aiEnginesFromSiteSettings(settings),
    overrides
  );

  const resolved: ResolvedAiEngines = {
    preferences,
    vision: resolveEngine("vision", preferences.vision),
    text: resolveEngine("text", preferences.text),
    cutout: resolveEngine("cutout", preferences.cutout),
    video: resolveEngine("video", preferences.video),
  };

  return resolved;
}

export function resolveWithFallback(
  capability: AiCapability,
  preference: AiEngineProvider | undefined
): AiResolvedProvider {
  try {
    const resolved = resolveEngine(capability, preference);
    assertEngineAvailable(capability, resolved);
    return resolved;
  } catch {
    if (preference === "auto" || !preference) {
      return "replicate";
    }
    throw new Error(
      capability === "cutout" || capability === "video"
        ? "המשימה דורשת Replicate — בחרו Replicate או אוטומטי"
        : "אין מנוע AI זמין — הגדירו GEMINI_API_KEY או REPLICATE_API_TOKEN"
    );
  }
}
