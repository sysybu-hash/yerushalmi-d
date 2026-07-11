import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import {
  isReplicateConfigured,
  runReplicateModel,
} from "@/lib/studio-beta/replicate-client";
import {
  generateVeoVideo,
  isGeminiConfigured,
} from "@/lib/studio-beta/gemini-client";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";
import {
  resizeForAiInput,
  zoompanFromImage,
} from "@/lib/studio-beta/cloudinary-transform";
import {
  getVideoEngine,
  isEngineAvailable,
  type VideoEngineId,
} from "@/lib/studio-beta/engines";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  DEFAULT_VIDEO_PROMPT,
  JEWELRY_STRUCTURE_LOCK,
} from "@/lib/studio-beta/prompts";
import { StudioBetaError } from "@/lib/studio-beta/errors";

export type VideoPipelineInput = {
  imageUrl: string;
  engine: VideoEngineId;
  durationSec: number;
  customPrompt: string | null;
  mode: "catalog" | "marketing";
};

export type VideoPipelineResult = {
  resultUrl: string;
  engine: string;
  modelId: string;
  costUsd: number;
  /** gif = תנועת Ken Burns חינמית, מוצג ב-<img>; video = mp4 אמיתי, מוצג ב-<video> */
  mediaKind: "video" | "gif";
};

async function downloadAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`הורדת קובץ נכשלה (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function bufferToDataUri(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function firstUrlFromOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0] as string;
  }
  return null;
}

/** שלב 3 (וידאו) — כל פרומפט מסתיים ב-JEWELRY_STRUCTURE_LOCK */
export async function runVideoPipeline(
  input: VideoPipelineInput
): Promise<VideoPipelineResult> {
  const engine = getVideoEngine(input.engine);
  if (!engine) {
    throw new StudioBetaError("VALIDATION", "מנוע וידאו לא מוכר");
  }
  const providers = {
    replicate: isReplicateConfigured(),
    gemini: isGeminiConfigured(),
  };
  if (!isEngineAvailable(engine, providers)) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      `${engine.label} אינו מוגדר במערכת`
    );
  }

  const prompt = [DEFAULT_VIDEO_PROMPT, input.customPrompt, JEWELRY_STRUCTURE_LOCK]
    .filter(Boolean)
    .join(" ");

  if (input.engine === "cloudinary-preserve") {
    const url = zoompanFromImage(input.imageUrl, input.durationSec);
    return {
      resultUrl: url,
      engine: input.engine,
      modelId: "cloudinary-zoompan",
      costUsd: 0,
      mediaKind: "gif",
    };
  }

  if (input.engine === "kling-v3") {
    const output = await runReplicateModel("kwaivgi/kling-v3-video", {
      start_image: resizeForAiInput(input.imageUrl),
      prompt,
      negative_prompt: DEFAULT_VIDEO_NEGATIVE_PROMPT,
      duration: input.durationSec,
    });
    const url = firstUrlFromOutput(output);
    if (!url) {
      throw new StudioBetaError("PROVIDER_ERROR", "Kling לא החזיר וידאו");
    }
    const buffer = await downloadAsBuffer(url);
    const uploaded = await uploadToCloudinary({
      source: bufferToDataUri(buffer, "video/mp4"),
      resourceType: "video",
      filenamePrefix: "studio-beta-video-kling",
    });
    await trackAiUsage({
      provider: "replicate",
      capability: "video",
      modelId: "kwaivgi/kling-v3-video",
      mode: input.mode,
      success: true,
      metadata: { app: "studio-beta" },
    });
    return {
      resultUrl: uploaded.url,
      engine: input.engine,
      modelId: "kwaivgi/kling-v3-video",
      costUsd: estimateCostUsd("kwaivgi/kling-v3-video", null),
      mediaKind: "video",
    };
  }

  // veo-fast / veo-pro
  const sourceBuffer = await downloadAsBuffer(resizeForAiInput(input.imageUrl));
  const { videoUrl, modelId } = await generateVeoVideo({
    prompt,
    imageDataUri: bufferToDataUri(sourceBuffer, "image/png"),
    durationSec: input.durationSec,
    fast: input.engine === "veo-fast",
  });
  const videoBuffer = await downloadAsBuffer(videoUrl);
  const uploaded = await uploadToCloudinary({
    source: bufferToDataUri(videoBuffer, "video/mp4"),
    resourceType: "video",
    filenamePrefix: "studio-beta-video-veo",
  });
  await trackAiUsage({
    provider: "gemini",
    capability: "video",
    modelId,
    mode: input.mode,
    success: true,
    metadata: { app: "studio-beta" },
  });
  return {
    resultUrl: uploaded.url,
    engine: input.engine,
    modelId,
    costUsd: estimateCostUsd(modelId, null),
    mediaKind: "video",
  };
}
