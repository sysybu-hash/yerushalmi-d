import type { AiBackgroundProvider, AiEngineConfig, AiEngineProvider } from "@/lib/ai-engines";

/** תווית שיטת הבידוד לפי שם הקובץ ב-Cloudinary */
export function cutoutMethodLabel(url: string): string | null {
  if (/studio-cutout-local/i.test(url)) {
    return "פרוצדורלי (רקע לבן אחיד)";
  }
  if (/studio-cutout-bria/i.test(url)) {
    return "Bria AI (Replicate)";
  }
  if (/studio-cutout-gemini/i.test(url)) {
    return "Gemini AI";
  }
  return null;
}

export function resolvedCutoutHint(preference: AiEngineProvider): string {
  switch (preference) {
    case "auto":
      return "Bria (Replicate) — ברירת מחדל לאיכות גבוהה";
    case "replicate":
      return "תמיד Bria (Replicate) — בתשלום";
    case "gemini":
      return "תמיד Gemini — בתשלום";
    default:
      return "";
  }
}

export function isAiBackgroundProvider(
  provider: AiBackgroundProvider
): boolean {
  return provider === "replicate" || provider === "gemini";
}

/** מקור אמת יחיד: האם נדרש רקע AI גנרטיבי */
export function useAiBackgroundFromEngines(engines: AiEngineConfig): boolean {
  return isAiBackgroundProvider(engines.background);
}

export function syncEnginesForUseAiBackground(
  engines: AiEngineConfig,
  useAiBackground: boolean
): AiEngineConfig {
  if (!useAiBackground) {
    return { ...engines, background: "procedural" };
  }
  if (engines.background === "procedural") {
    return { ...engines, background: "auto" };
  }
  return engines;
}

export function syncUseAiBackgroundFromEngines(
  engines: AiEngineConfig
): boolean {
  return useAiBackgroundFromEngines(engines);
}

export function aiBackgroundProviderLabel(
  provider: AiBackgroundProvider,
  useAiBackground: boolean
): string {
  if (!useAiBackground || provider === "procedural") {
    return "הרכבה פרוצדורלית (חינם)";
  }
  switch (provider) {
    case "auto":
      return "רקע AI — מנוע אוטומטי";
    case "replicate":
      return "רקע AI — Flux / SDXL";
    case "gemini":
      return "רקע AI — Gemini";
    default:
      return "רקע AI";
  }
}
