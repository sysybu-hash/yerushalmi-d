import type { AiEngineConfig, StudioPipelineMode } from "@/lib/ai-engines";
import { studioRemoveBackground } from "@/lib/ai-studio-media";
import { getResolvedAiEngines, executeWithEngineFallback } from "@/lib/ai-engine-resolve";
import { assertStudioEnv } from "@/lib/studio-env";
import {
  getCachedCutout,
  setCachedCutout,
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

  if (options.cutoutUrl?.trim()) {
    return { url: options.cutoutUrl.trim(), cached: true };
  }

  const cached = getCachedCutout(imageUrl);
  if (cached) {
    return { url: cached, cached: true };
  }

  const result = await executeWithEngineFallback(
    "cutout",
    engines.preferences.cutout,
    (cutoutEngine) =>
      studioRemoveBackground(imageUrl, cutoutEngine, {
        mode: studioMode,
        projectId: options.projectId,
      })
  );

  setCachedCutout(imageUrl, result.url);
  return { url: result.url, cached: false };
}
