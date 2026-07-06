import {
  type AiCapability,
  type AiEngineConfig,
  type AiEngineProvider,
  type AiBackgroundResolved,
  assertEngineAvailable,
  mergeAiEngineConfig,
  aiEnginesFromSiteSettings,
  resolveBackgroundEngine,
  resolveEngine,
  type StudioPipelineMode,
} from "@/lib/ai-engines";
import { getSiteSettings } from "@/lib/site-settings";

export type ResolvedAiEngines = {
  preferences: AiEngineConfig;
  vision: ReturnType<typeof resolveEngine>;
  text: ReturnType<typeof resolveEngine>;
  cutout: ReturnType<typeof resolveEngine>;
  background: AiBackgroundResolved;
  video: ReturnType<typeof resolveEngine>;
};

export async function getResolvedAiEngines(
  overrides?: Partial<AiEngineConfig>,
  studioMode: StudioPipelineMode = "catalog",
  useAiBackground = false
): Promise<ResolvedAiEngines> {
  const settings = await getSiteSettings();
  const preferences = mergeAiEngineConfig(
    aiEnginesFromSiteSettings(settings),
    overrides
  );

  return {
    preferences,
    vision: resolveEngine("vision", preferences.vision),
    text: resolveEngine("text", preferences.text),
    cutout: resolveEngine("cutout", preferences.cutout),
    background: resolveBackgroundEngine(
      preferences.background,
      studioMode,
      useAiBackground
    ),
    video: resolveEngine("video", preferences.video),
  };
}

export function resolveWithFallback(
  capability: AiCapability,
  preference: AiEngineProvider | undefined
): ReturnType<typeof resolveEngine> {
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
