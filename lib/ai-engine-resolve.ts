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
import { QuotaExceededError } from "@/lib/ai-usage";

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

/**
 * מדיניות fallback בין מנועים:
 * - "never" (ברירת מחדל) — כשל במנוע הראשי לא מפעיל מנוע שני בתשלום.
 * - "billing-errors" — fallback רק כשהכשל הוא 401/402/rate-limit,
 *   כלומר המנוע הראשי לא רץ ולא חויב.
 * - "always" — ההתנהגות הישנה (לא מומלץ לפעולות יקרות).
 */
export type EngineFallbackPolicy = "never" | "billing-errors" | "always";

function isNonBilledFailure(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : String(error ?? "");
  return /402|401|insufficient credit|אין מספיק קרדיט|unauthorized|rate limit|billing|payment|out of credits|quota/i.test(
    message
  );
}

/** במצב אוטומטי — ניסיון ראשון במנוע המועדף; fallback רק לפי המדיניות */
export async function executeWithEngineFallback<T>(
  capability: AiCapability,
  preference: AiEngineProvider | undefined,
  run: (engine: AiResolvedProvider) => Promise<T>,
  options: { fallbackPolicy?: EngineFallbackPolicy } = {}
): Promise<T> {
  const policy = options.fallbackPolicy ?? "never";
  const pref = preference ?? "auto";
  const primary = resolveEngine(capability, pref);
  assertEngineAvailable(capability, primary);

  try {
    return await run(primary);
  } catch (error) {
    if (pref !== "auto") throw error;
    // מכסה יומית היא גלובלית — מנוע אחר לא יעזור, רק יעלה כסף
    if (error instanceof QuotaExceededError) throw error;
    if (policy === "never") throw error;
    if (policy === "billing-errors" && !isNonBilledFailure(error)) throw error;

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
