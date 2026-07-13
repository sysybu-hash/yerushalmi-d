import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import { analyzeImage, isGeminiConfigured } from "@/lib/studio-beta/gemini-client";
import {
  isReplicateConfigured,
  runReplicateModel,
} from "@/lib/studio-beta/replicate-client";
import { resizeForAiInput } from "@/lib/studio-beta/cloudinary-transform";
import { buildJewelryIdentifyPrompt } from "@/lib/studio-beta/prompts";
import { StudioBetaError } from "@/lib/studio-beta/errors";

export type IdentifyPipelineInput = {
  sourceImageUrl: string;
  mode: "catalog" | "marketing";
};

export type IdentifyPipelineResult = {
  description: string;
  modelId: string;
  costUsd: number;
};

const MOONDREAM_MODEL_ID = "lucataco/moondream2";

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

/**
 * זיהוי תמונה best-effort — מנסה Gemini קודם, נופל ל-Moondream (Replicate)
 * אם Gemini לא מוגדר/נכשל. זורק רק אם אף ספק לא הצליח בסוף.
 */
export async function runIdentifyPipeline(
  input: IdentifyPipelineInput
): Promise<IdentifyPipelineResult> {
  const prompt = buildJewelryIdentifyPrompt();
  const sourceBuffer = await downloadAsBuffer(resizeForAiInput(input.sourceImageUrl));
  const imageDataUri = bufferToDataUri(sourceBuffer);

  if (isGeminiConfigured()) {
    try {
      const { text, modelId } = await analyzeImage({ prompt, imageDataUri });
      await trackAiUsage({
        provider: "gemini",
        capability: "vision",
        modelId,
        mode: input.mode,
        success: true,
        metadata: { app: "studio-beta" },
      });
      return { description: text, modelId, costUsd: estimateCostUsd(modelId, null) };
    } catch {
      // best-effort — ננסה Replicate בהמשך
    }
  }

  if (isReplicateConfigured()) {
    const { output, predictTimeSec } = await runReplicateModel(MOONDREAM_MODEL_ID, {
      image: imageDataUri,
      prompt,
    });
    const text = Array.isArray(output)
      ? output.join(" ").trim()
      : String(output ?? "").trim();
    if (!text) {
      throw new StudioBetaError("PROVIDER_ERROR", "Moondream לא החזיר תיאור");
    }
    await trackAiUsage({
      provider: "replicate",
      capability: "vision",
      modelId: MOONDREAM_MODEL_ID,
      mode: input.mode,
      success: true,
      metadata: { app: "studio-beta", predictTimeSec },
    });
    return {
      description: text,
      modelId: MOONDREAM_MODEL_ID,
      costUsd: estimateCostUsd(MOONDREAM_MODEL_ID, predictTimeSec),
    };
  }

  throw new StudioBetaError(
    "PROVIDER_NOT_CONFIGURED",
    "לא מוגדר אף ספק AI לזיהוי תמונה (GEMINI_API_KEY או REPLICATE_API_TOKEN)"
  );
}
