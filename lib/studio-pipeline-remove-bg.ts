import { rembgSourceUrl } from "@/lib/cloudinary-url";
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

export async function pipelineRemoveBackground(imageUrl: string) {
  assertStudioEnv();
  assertCloudinaryUrl(imageUrl);

  const optimizedUrl = rembgSourceUrl(imageUrl);
  const output = await replicate.run(MODELS.rembg, {
    input: { image: optimizedUrl },
  });

  return { url: extractUrl(output) };
}
