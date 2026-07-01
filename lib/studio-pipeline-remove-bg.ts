import { rembgSourceUrl } from "@/lib/cloudinary-url";
import { assertEngineAvailable, resolveEngine } from "@/lib/ai-engines";
import type { AiEngineConfig } from "@/lib/ai-engines";
import { getResolvedAiEngines } from "@/lib/ai-engine-resolve";
import { assertStudioEnv } from "@/lib/studio-env";
import {
  extractUrl,
  MODELS,
  replicate,
} from "@/lib/studio-replicate";

function assertCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("יש להעלות תמונת מקור דרך Cloudinary");
  }
}

export async function pipelineRemoveBackground(
  imageUrl: string,
  engineOverrides?: Partial<AiEngineConfig>
) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const engines = await getResolvedAiEngines(engineOverrides);
  const cutoutEngine = resolveEngine("cutout", engines.preferences.cutout);
  assertEngineAvailable("cutout", cutoutEngine);

  const optimizedUrl = rembgSourceUrl(imageUrl);
  const output = await replicate.run(MODELS.rembg, {
    input: {
      image: optimizedUrl,
      preserve_alpha: true,
      preserve_partial_alpha: true,
    },
  });

  return { url: extractUrl(output) };
}
