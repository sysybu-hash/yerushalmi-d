import { assertEngineAvailable, resolveEngine, type StudioPipelineMode } from "@/lib/ai-engines";
import type { AiEngineConfig } from "@/lib/ai-engines";
import { studioRemoveBackground } from "@/lib/ai-studio-media";
import { getResolvedAiEngines } from "@/lib/ai-engine-resolve";
import { assertStudioEnv } from "@/lib/studio-env";
import { validateSourceImageResolution } from "@/lib/studio-source-validation";
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
    skipResolutionCheck?: boolean;
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

  if (!options.skipResolutionCheck) {
    await validateSourceImageResolution(imageUrl);
  }

  let cutoutEngine = resolveEngine("cutout", engines.preferences.cutout, studioMode);
  if (studioMode === "catalog" && engines.preferences.cutout === "auto") {
    cutoutEngine = "replicate";
  }
  assertEngineAvailable("cutout", cutoutEngine);

  const result = await studioRemoveBackground(imageUrl, cutoutEngine, {
    mode: studioMode,
    projectId: options.projectId,
  });

  setCachedCutout(imageUrl, result.url);
  return { url: result.url, cached: false };
}
