export type AiEngineProvider = "auto" | "replicate" | "gemini";
export type AiBackgroundProvider =
  | "auto"
  | "procedural"
  | "replicate"
  | "gemini";
export type AiResolvedProvider = "replicate" | "gemini";
export type AiBackgroundResolved = "procedural" | "replicate" | "gemini";
export type AiCapability = "vision" | "text" | "cutout" | "video";
export type StudioPipelineMode = "catalog" | "marketing";

export type AiEngineConfig = {
  vision: AiEngineProvider;
  text: AiEngineProvider;
  cutout: AiEngineProvider;
  background: AiBackgroundProvider;
  video: AiEngineProvider;
};

export const DEFAULT_AI_ENGINES: AiEngineConfig = {
  vision: "auto",
  text: "auto",
  cutout: "auto",
  background: "auto",
  video: "auto",
};

export const AI_ENGINE_OPTIONS: {
  value: AiEngineProvider;
  label: string;
  description: string;
}[] = [
  {
    value: "auto",
    label: "אוטומטי (מומלץ)",
    description: "בוחר את המנוע הזמין והמתאים ביותר לכל משימה",
  },
  {
    value: "replicate",
    label: "Replicate",
    description: "Moondream2, Bria, Flux, Kling 3, Llama 3.3",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    description: "Nano Banana 2, Gemini 3.5, Veo 3.1 — ראייה, טקסט, תמונה ווידאו",
  },
];

export const AI_BACKGROUND_OPTIONS: {
  value: AiBackgroundProvider;
  label: string;
  description: string;
}[] = [
  {
    value: "auto",
    label: "אוטומטי (פרוצדורלי בקטלוג)",
    description: "רקע פרוצדורלי בקטלוג — ללא עלות API",
  },
  {
    value: "procedural",
    label: "פרוצדורלי (ללא AI)",
    description: "Sharp/SVG — עקבי, מהיר, ללא עלות",
  },
  {
    value: "replicate",
    label: "Replicate (Flux / SDXL)",
    description: "רקע AI — +1 קריאת API",
  },
  {
    value: "gemini",
    label: "Gemini (Nano Banana)",
    description: "רקע AI גנרטיבי — +1 קריאת API",
  },
];

export const AI_CAPABILITY_LABELS: Record<
  AiCapability,
  { label: string; hint: string }
> = {
  vision: {
    label: "זיהוי תמונה",
    hint: "Gemini 3.5 או Moondream2 — ניתוח תכשיטים",
  },
  text: {
    label: "טקסט ותיאורים",
    hint: "Gemini 3.5 או Llama 3.3 — שמות, תיאורים, תרגום",
  },
  cutout: {
    label: "הסרת רקע",
    hint: "Bria RMBG (אוטומטי) או Nano Banana 2 (Gemini)",
  },
  video: {
    label: "יצירת וידאו",
    hint: "Veo 3.1 (Gemini) או Kling 3 (Replicate) — מצב שיווק",
  },
};

export const AI_BACKGROUND_LABEL = {
  label: "רקע",
  hint: "פרוצדורלי לקטלוג · Flux/SDXL/Gemini במצב שיווק",
};

const VALID_PROVIDERS = new Set<AiEngineProvider>([
  "auto",
  "replicate",
  "gemini",
]);

const VALID_BACKGROUND_PROVIDERS = new Set<AiBackgroundProvider>([
  "auto",
  "procedural",
  "replicate",
  "gemini",
]);

export function parseAiEngineProvider(
  value: string | null | undefined
): AiEngineProvider {
  const raw = value?.trim().toLowerCase();
  if (raw && VALID_PROVIDERS.has(raw as AiEngineProvider)) {
    return raw as AiEngineProvider;
  }
  return "auto";
}

export function parseAiBackgroundProvider(
  value: string | null | undefined
): AiBackgroundProvider {
  const raw = value?.trim().toLowerCase();
  if (raw && VALID_BACKGROUND_PROVIDERS.has(raw as AiBackgroundProvider)) {
    return raw as AiBackgroundProvider;
  }
  return "auto";
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}

/** מנוע בפועל לאחר החלת מצב אוטומטי — מודע ל-capability */
export function resolveEngine(
  capability: AiCapability,
  preference: AiEngineProvider | undefined
): AiResolvedProvider {
  const pref = preference ?? "auto";

  if (pref === "replicate") return "replicate";
  if (pref === "gemini") return "gemini";

  switch (capability) {
    case "cutout":
      return "replicate";
    case "video":
      if (isReplicateConfigured()) return "replicate";
      return isGeminiConfigured() ? "gemini" : "replicate";
    case "vision":
    case "text":
      return isGeminiConfigured() ? "gemini" : "replicate";
    default:
      return isReplicateConfigured() ? "replicate" : "gemini";
  }
}

/** מנוע רקע — פרוצדורלי כברירת מחדל בקטלוג */
export function resolveBackgroundEngine(
  preference: AiBackgroundProvider | undefined,
  studioMode: StudioPipelineMode = "catalog",
  useAiBackground = false
): AiBackgroundResolved {
  if (studioMode === "catalog" && !useAiBackground) {
    return "procedural";
  }

  const pref = preference ?? "auto";

  if (pref === "procedural") return "procedural";
  if (pref === "replicate") return "replicate";
  if (pref === "gemini") return "gemini";

  if (useAiBackground) {
    return isGeminiConfigured() ? "gemini" : "replicate";
  }

  return "procedural";
}

export function assertEngineAvailable(
  _capability: AiCapability,
  resolved: AiResolvedProvider
): void {
  if (resolved === "gemini" && !isGeminiConfigured()) {
    throw new Error(
      "מנוע Gemini לא מוגדר — הוסיפו GEMINI_API_KEY ב-Vercel או בחרו Replicate / אוטומטי"
    );
  }

  if (resolved === "replicate" && !isReplicateConfigured()) {
    throw new Error(
      "מנוע Replicate לא מוגדר — הוסיפו REPLICATE_API_TOKEN ב-Vercel"
    );
  }
}

export function assertBackgroundEngineAvailable(
  resolved: AiBackgroundResolved
): void {
  if (resolved === "procedural") return;
  if (resolved === "gemini" && !isGeminiConfigured()) {
    throw new Error(
      "מנוע Gemini לא מוגדר לרקע — בחרו פרוצדורלי או Replicate"
    );
  }
  if (resolved === "replicate" && !isReplicateConfigured()) {
    throw new Error(
      "מנוע Replicate לא מוגדר לרקע — בחרו פרוצדורלי"
    );
  }
}

export function mergeAiEngineConfig(
  ...layers: Array<Partial<AiEngineConfig> | undefined>
): AiEngineConfig {
  return layers.reduce<AiEngineConfig>(
    (acc, layer) => ({ ...acc, ...layer }),
    { ...DEFAULT_AI_ENGINES }
  );
}

export function aiEnginesFromSiteSettings(settings: {
  aiEngineVision?: string;
  aiEngineText?: string;
  aiEngineCutout?: string;
  aiEngineBackground?: string;
  aiEngineVideo?: string;
}): AiEngineConfig {
  return {
    vision: parseAiEngineProvider(settings.aiEngineVision),
    text: parseAiEngineProvider(settings.aiEngineText),
    cutout: parseAiEngineProvider(settings.aiEngineCutout),
    background: parseAiBackgroundProvider(settings.aiEngineBackground),
    video: parseAiEngineProvider(settings.aiEngineVideo),
  };
}
