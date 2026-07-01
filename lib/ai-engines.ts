export type AiEngineProvider = "auto" | "replicate" | "gemini";
export type AiResolvedProvider = "replicate" | "gemini";
export type AiCapability = "vision" | "text" | "cutout" | "video";

export type AiEngineConfig = Record<AiCapability, AiEngineProvider>;

export const DEFAULT_AI_ENGINES: AiEngineConfig = {
  vision: "auto",
  text: "auto",
  cutout: "auto",
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
    description: "Moondream2, LLaVA, Bria, Kling 3, Llama 3.3",
  },
  {
    value: "gemini",
    label: "Google Gemini",
    description: "Gemini 3.5 Flash — זיהוי תמונה וטקסט בעברית",
  },
];

/** cutout ו-video תמיד דרך Replicate — Gemini לא מוצע */
export function engineOptionsForCapability(
  capability: AiCapability
): typeof AI_ENGINE_OPTIONS {
  if (capability === "cutout" || capability === "video") {
    return AI_ENGINE_OPTIONS.filter((option) => option.value !== "gemini");
  }
  return AI_ENGINE_OPTIONS;
}

function normalizeCapabilityPreference(
  capability: AiCapability,
  provider: AiEngineProvider
): AiEngineProvider {
  if (
    (capability === "cutout" || capability === "video") &&
    provider === "gemini"
  ) {
    return "auto";
  }
  return provider;
}

export const AI_CAPABILITY_LABELS: Record<
  AiCapability,
  { label: string; hint: string }
> = {
  vision: {
    label: "זיהוי תמונה",
    hint: "ניתוח תכשיטים למילוי אוטומטי",
  },
  text: {
    label: "טקסט ותיאורים",
    hint: "שמות מוצר, תיאורים, תרגום פרומפטים",
  },
  cutout: {
    label: "הסרת רקע",
    hint: "Bria RMBG (Replicate) — Gemini לא נתמך",
  },
  video: {
    label: "יצירת וידאו",
    hint: "Kling 3 (Replicate) — Gemini לא נתמך כרגע",
  },
};

const VALID_PROVIDERS = new Set<AiEngineProvider>([
  "auto",
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

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN?.trim());
}

/** מנוע בפועל לאחר החלת מצב אוטומטי */
export function resolveEngine(
  capability: AiCapability,
  preference: AiEngineProvider | undefined
): AiResolvedProvider {
  const pref = normalizeCapabilityPreference(capability, preference ?? "auto");

  if (capability === "cutout" || capability === "video") {
    return "replicate";
  }

  if (pref === "replicate") return "replicate";
  if (pref === "gemini") return "gemini";

  if (isGeminiConfigured()) return "gemini";
  return "replicate";
}

export function assertEngineAvailable(
  capability: AiCapability,
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

export function mergeAiEngineConfig(
  ...layers: Array<Partial<AiEngineConfig> | undefined>
): AiEngineConfig {
  const merged = layers.reduce<AiEngineConfig>(
    (acc, layer) => ({ ...acc, ...layer }),
    { ...DEFAULT_AI_ENGINES }
  );

  return {
    vision: merged.vision,
    text: merged.text,
    cutout: normalizeCapabilityPreference("cutout", merged.cutout),
    video: normalizeCapabilityPreference("video", merged.video),
  };
}

export function aiEnginesFromSiteSettings(settings: {
  aiEngineVision?: string;
  aiEngineText?: string;
  aiEngineCutout?: string;
  aiEngineVideo?: string;
}): AiEngineConfig {
  return {
    vision: parseAiEngineProvider(settings.aiEngineVision),
    text: parseAiEngineProvider(settings.aiEngineText),
    cutout: parseAiEngineProvider(settings.aiEngineCutout),
    video: parseAiEngineProvider(settings.aiEngineVideo),
  };
}
