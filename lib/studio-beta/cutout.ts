import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import {
  isReplicateConfigured,
  runReplicateModel,
} from "@/lib/studio-beta/replicate-client";
import {
  generateOrEditImage,
  isGeminiConfigured,
} from "@/lib/studio-beta/gemini-client";
import { chromaKeyFromEdges } from "@/lib/studio-beta/chroma-key";
import { GEMINI_ISOLATE_PROMPT } from "@/lib/studio-beta/prompts";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";
import { resizeForAiInput } from "@/lib/studio-beta/cloudinary-transform";

export type CutoutResult = {
  url: string;
  method: "bria" | "gemini-chroma";
  modelId: string;
  costUsd: number;
} | null;

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

const BRIA_MODEL_ID = "bria/remove-background";

/**
 * ניסיון בידוד best-effort — לעולם לא זורק. מנסה Bria (Replicate) קודם:
 * זול, אמין, ומחזיר אלפא נקי טבעית בלי צורך בעיבוד נוסף. אם לא
 * מוגדר/נכשל, מנסה Gemini + flood-fill ירוק מינימלי (נתיב פחות מדויק,
 * מסומן ככזה). אם גם זה נכשל — מחזיר null בלי שגיאה כדי שהקורא ימשיך
 * עם התמונה המקורית, בלי "עצירה קשה".
 */
export async function attemptCutout(
  sourceUrl: string,
  mode: "catalog" | "marketing"
): Promise<CutoutResult> {
  if (isReplicateConfigured()) {
    try {
      const inputUrl = resizeForAiInput(sourceUrl);
      const output = await runReplicateModel(BRIA_MODEL_ID, {
        image: inputUrl,
        preserve_alpha: true,
      });
      const outputUrl = Array.isArray(output)
        ? (output[0] as string)
        : (output as string);
      if (outputUrl) {
        const buffer = await downloadAsBuffer(outputUrl);
        const uploaded = await uploadToCloudinary({
          source: bufferToDataUri(buffer),
          resourceType: "image",
          filenamePrefix: "studio-beta-cutout-bria",
        });
        await trackAiUsage({
          provider: "replicate",
          capability: "cutout",
          modelId: BRIA_MODEL_ID,
          mode,
          success: true,
          metadata: { app: "studio-beta" },
        });
        return {
          url: uploaded.url,
          method: "bria",
          modelId: BRIA_MODEL_ID,
          costUsd: estimateCostUsd(BRIA_MODEL_ID, null),
        };
      }
    } catch {
      // best-effort — ממשיכים לנתיב הבא, לא זורקים
    }
  }

  if (isGeminiConfigured()) {
    try {
      const sourceBuffer = await downloadAsBuffer(resizeForAiInput(sourceUrl));
      const { dataUri, modelId } = await generateOrEditImage({
        prompt: GEMINI_ISOLATE_PROMPT,
        imageDataUri: bufferToDataUri(sourceBuffer),
      });
      const match = dataUri.match(/^data:[^;]+;base64,([\s\S]+)$/);
      if (match) {
        const keyed = await chromaKeyFromEdges(Buffer.from(match[1], "base64"));
        const uploaded = await uploadToCloudinary({
          source: bufferToDataUri(keyed),
          resourceType: "image",
          filenamePrefix: "studio-beta-cutout-gemini",
        });
        await trackAiUsage({
          provider: "gemini",
          capability: "cutout",
          modelId,
          mode,
          success: true,
          metadata: { app: "studio-beta" },
        });
        return {
          url: uploaded.url,
          method: "gemini-chroma",
          modelId,
          costUsd: estimateCostUsd(modelId, null),
        };
      }
    } catch {
      // best-effort — נכשל בלי לזרוק
    }
  }

  return null;
}
