import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import {
  generateOrEditImage,
  isGeminiConfigured,
} from "@/lib/studio-beta/gemini-client";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";
import { resizeForAiInput } from "@/lib/studio-beta/cloudinary-transform";
import {
  buildCompleteEdgesPrompt,
  buildCleanBackgroundPrompt,
  buildSharpenSourcePrompt,
} from "@/lib/studio-beta/prompts";
import { StudioBetaError } from "@/lib/studio-beta/errors";

export type SourcePrepPresetId = "complete" | "cleanup" | "enhance";

export type SourcePrepPipelineInput = {
  sourceImageUrl: string;
  presetId: SourcePrepPresetId | null;
  customPrompt: string | null;
  mode: "catalog" | "marketing";
};

export type SourcePrepPipelineResult = {
  resultUrl: string;
  modelId: string;
  costUsd: number;
};

async function downloadAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`הורדת תמונה נכשלה (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function bufferToDataUri(buffer: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function resolvePrompt(
  presetId: SourcePrepPresetId | null,
  customPrompt: string | null
): string {
  const custom = customPrompt?.trim();
  if (custom) return custom;
  if (presetId === "complete") return buildCompleteEdgesPrompt();
  if (presetId === "cleanup") return buildCleanBackgroundPrompt();
  return buildSharpenSourcePrompt();
}

/**
 * הכנת תמונת מקור ב-AI (השלמת קצוות / ניקוי רקע / חידוד) — בקשה יזומה
 * של המשתמש, לא נפילה שקטה: כישלון ספק מדווח כשגיאה ברורה, לא נבלע.
 */
export async function runSourcePrepPipeline(
  input: SourcePrepPipelineInput
): Promise<SourcePrepPipelineResult> {
  if (!isGeminiConfigured()) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      "GEMINI_API_KEY אינו מוגדר — נדרש להכנת מקור ב-AI"
    );
  }

  const prompt = resolvePrompt(input.presetId, input.customPrompt);
  const sourceBuffer = await downloadAsBuffer(resizeForAiInput(input.sourceImageUrl));
  const { dataUri, modelId } = await generateOrEditImage({
    prompt,
    imageDataUri: bufferToDataUri(sourceBuffer),
  });
  const uploaded = await uploadToCloudinary({
    source: dataUri,
    resourceType: "image",
    filenamePrefix: "studio-beta-source-prep",
  });
  await trackAiUsage({
    provider: "gemini",
    capability: "source-prep",
    modelId,
    mode: input.mode,
    success: true,
    metadata: { app: "studio-beta" },
  });

  return {
    resultUrl: uploaded.url,
    modelId,
    costUsd: estimateCostUsd(modelId, null),
  };
}
