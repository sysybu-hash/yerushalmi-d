import { estimateCostUsd } from "@/lib/ai-cost-rates";

/**
 * רגיסטרי מנועים — מקור אמת יחיד ל-API ול-UI. בכוונה אין כאן שום
 * פונקציית resolve("auto"): הבחירה תמיד ידנית ומפורשת מהמשתמש.
 *
 * שים לב: הקובץ הזה מיובא גם מרכיבי לקוח (לתצוגת הבורר), אז אסור לו
 * לבדוק משתני סביבה של מפתחות (הם undefined בדפדפן ולא NEXT_PUBLIC_).
 * את הבדיקה בפועל עושים isReplicateConfigured()/isGeminiConfigured()
 * בצד שרת בלבד, ומעבירים את התוצאה כ-prop דרך ProvidersConfigured.
 */

export type BackgroundEngineId =
  | "procedural"
  | "flux-schnell"
  | "sdxl"
  | "gemini-compose";

export type VideoEngineId =
  | "cloudinary-preserve"
  | "kling-v3"
  | "veo-fast"
  | "veo-pro";

export type EngineDef = {
  id: string;
  label: string;
  description: string;
  provider: "replicate" | "gemini" | "cloudinary" | "local";
  /** מזהה עלייה בהתאמה למפתחות lib/ai-cost-rates.ts, ריק = חינם */
  costModelId: string | null;
  /** האם נדרש בידוד לפני שימוש במנוע הזה (רק לתצוגה — הריצה עצמה תמיד best-effort) */
  usesCutout: boolean;
};

export type ProvidersConfigured = { replicate: boolean; gemini: boolean };

/** זמינות מנוע לפי provider — מחושבת מ-ProvidersConfigured שמגיע מהשרת */
export function isEngineAvailable(
  engine: EngineDef,
  providers: ProvidersConfigured
): boolean {
  if (engine.provider === "local" || engine.provider === "cloudinary") {
    return true;
  }
  return providers[engine.provider];
}

export const BACKGROUND_ENGINES: EngineDef[] = [
  {
    id: "gemini-compose",
    label: "Gemini — הרכבה חכמה",
    description: "קריאה אחת שממקמת את התכשיט על הרקע, ללא בידוד נפרד",
    provider: "gemini",
    costModelId: "gemini-3.1-flash-image",
    usesCutout: false,
  },
  {
    id: "flux-schnell",
    label: "Flux Schnell",
    description: "רקע AI מהיר, איכות טובה",
    provider: "replicate",
    costModelId: "black-forest-labs/flux-schnell",
    usesCutout: true,
  },
  {
    id: "sdxl",
    label: "SDXL",
    description: "רקע AI באיכות גבוהה יותר",
    provider: "replicate",
    costModelId: "stability-ai/sdxl",
    usesCutout: true,
  },
  {
    id: "procedural",
    label: "פרוצדורלי (חינם)",
    description: "רקע גרדיאנט מעוצב ללא AI",
    provider: "local",
    costModelId: null,
    usesCutout: true,
  },
];

export const VIDEO_ENGINES: EngineDef[] = [
  {
    id: "cloudinary-preserve",
    label: "תנועה חינמית",
    description: "Ken Burns / שיפור וידאו — ללא עלות AI",
    provider: "cloudinary",
    costModelId: null,
    usesCutout: false,
  },
  {
    id: "kling-v3",
    label: "Kling v3",
    description: "וידאו AI, תמיכה במולטי-שוט ואודיו",
    provider: "replicate",
    costModelId: "kwaivgi/kling-v3-video",
    usesCutout: false,
  },
  {
    id: "veo-fast",
    label: "Veo — מהיר",
    description: "וידאו AI של Google, מהיר וזול יותר",
    provider: "gemini",
    costModelId: "veo-3.1-fast-generate-preview",
    usesCutout: false,
  },
  {
    id: "veo-pro",
    label: "Veo — Pro",
    description: "איכות גבוהה, 1080p ב-8 שניות",
    provider: "gemini",
    costModelId: "veo-3.1-generate-preview",
    usesCutout: false,
  },
];

/**
 * מנוע פאס הריאליזם (צללים/השתקפויות על ה-composite) — בכוונה לא חלק
 * מ-BACKGROUND_ENGINES: הוא לא מופיע בבורר המנועים, ורץ אוטומטית רק
 * בתוך שרשרת ה-Auto-Magic.
 */
export const REALISM_ENGINE: EngineDef = {
  id: "controlnet-realism",
  label: "פאס ריאליזם",
  description: "צללים והשתקפויות טבעיים על התוצאה המורכבת (SDXL-ControlNet)",
  provider: "replicate",
  costModelId: "lucataco/sdxl-controlnet",
  usesCutout: false,
};

export function getBackgroundEngine(id: string): EngineDef | undefined {
  return BACKGROUND_ENGINES.find((engine) => engine.id === id);
}

export function getVideoEngine(id: string): EngineDef | undefined {
  return VIDEO_ENGINES.find((engine) => engine.id === id);
}

/** עלות משוערת להצגה ב-UI — $0 למנועים חינמיים או למודל לא-מוכר */
export function estimateEngineCostUsd(engine: EngineDef): number {
  if (!engine.costModelId) return 0;
  return estimateCostUsd(engine.costModelId, null);
}
