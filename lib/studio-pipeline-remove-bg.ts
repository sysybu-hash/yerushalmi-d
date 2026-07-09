import type { AiEngineConfig, StudioPipelineMode } from "@/lib/ai-engines";
import { studioRemoveBackground } from "@/lib/ai-studio-media";
import { getResolvedAiEngines, executeWithEngineFallback } from "@/lib/ai-engine-resolve";
import { assertStudioEnv } from "@/lib/studio-env";
import {
  getPersistedCutout,
  persistCutout,
} from "@/lib/studio-cutout-cache";

function assertCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש להעלות תמונת מקור דרך Cloudinary");
  }
}

export async function pipelineRemoveBackground(
  imageUrl: string,
  engineOverrides?: Partial<AiEngineConfig>,
  options: {
    mode?: StudioPipelineMode;
    projectId?: number;
    cutoutUrl?: string;
    /** בידוד מחדש מאולץ — מתעלם ממטמון ומפרוצדורלי, ישר ל-AI */
    force?: boolean;
  } = {}
) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const studioMode = options.mode ?? "catalog";
  const engines = await getResolvedAiEngines(
    engineOverrides,
    studioMode,
    false
  );

  if (!options.force) {
    if (options.cutoutUrl?.trim()) {
      return { url: options.cutoutUrl.trim(), cached: true };
    }

    const cached = await getPersistedCutout(imageUrl);
    if (cached) {
      return { url: cached, cached: true };
    }
  }

  const result = await executeWithEngineFallback(
    "cutout",
    engines.preferences.cutout,
    (cutoutEngine) =>
      studioRemoveBackground(imageUrl, cutoutEngine, {
        mode: studioMode,
        projectId: options.projectId,
      }),
    // בלי fallback ל-Gemini: הבידוד שלו מבוסס על צביעת רקע ירוק וניקוי
    // צבע ידני (chroma-key) — טכניקה שביר "ה שמפרקת יהלומים מנצנצים
    // לרסיסים (הפאסטות הבוהקות מזוהות בטעות כרקע ונמחקות). עדיף כישלון
    // ברור עם הודעה ל-Replicate מאשר בידוד הרוס שמזהם כל הפקה בהמשך.
    { fallbackPolicy: "never" }
  );

  await persistCutout(imageUrl, result.url);
  return { url: result.url, cached: false };
}
