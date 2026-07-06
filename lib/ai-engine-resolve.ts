import {
  type AiCapability,
  type AiEngineConfig,
  type AiEngineProvider,
  type AiBackgroundResolved,
  type AiResolvedProvider,
  assertEngineAvailable,
  isGeminiConfigured,
  isReplicateConfigured,
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

function alternateEngine(engine: AiResolvedProvider): AiResolvedProvider {
  return engine === "replicate" ? "gemini" : "replicate";
}

/** במצב אוטומטי — ניסיון ראשון במנוע המועדף, מעבר למנוע החלופי בכשלון */
export async function executeWithEngineFallback<T>(
  capability: AiCapability,
  preference: AiEngineProvider | undefined,
  run: (engine: AiResolvedProvider) => Promise<T>
): Promise<T> {
  const pref = preference ?? "auto";
  const primary = resolveEngine(capability, pref);
  assertEngineAvailable(capability, primary);

  try {
    return await run(primary);
  } catch (error) {
    if (pref !== "auto") throw error;

    const fallback = alternateEngine(primary);
    if (fallback === "gemini" && !isGeminiConfigured()) throw error;
    if (fallback === "replicate" && !isReplicateConfigured()) throw error;

    try {
      assertEngineAvailable(capability, fallback);
    } catch {
      throw error;
    }

    console.warn(`studio_engine_fallback_${capability}`, {
      from: primary,
      to: fallback,
      message: error instanceof Error ? error.message : String(error),
    });

    return await run(fallback);
  }
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
      if (isGeminiConfigured()) return "gemini";
      if (isReplicateConfigured()) return "replicate";
    }
    throw new Error(
      capability === "cutout" || capability === "video"
        ? "אין מנוע AI זמין — הגדירו GEMINI_API_KEY או REPLICATE_API_TOKEN"
        : "אין מנוע AI זמין — הגדירו GEMINI_API_KEY או REPLICATE_API_TOKEN"
    );
  }
}
