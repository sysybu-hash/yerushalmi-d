import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import {
  isReplicateConfigured,
  runReplicateModel,
} from "@/lib/studio-beta/replicate-client";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";
import { resizeForAiInput } from "@/lib/studio-beta/cloudinary-transform";
import { resolveBackgroundHint } from "@/lib/studio-beta/backgrounds";
import {
  buildRealismPrompt,
  REALISM_NEGATIVE_PROMPT,
} from "@/lib/studio-beta/prompts";
import { StudioBetaError } from "@/lib/studio-beta/errors";

/**
 * פאס ריאליזם על התמונה המורכבת: SDXL-ControlNet (canny) מוסיף צל מגע
 * והשתקפויות טבעיות. ה-canny conditioning נגזר מתמונת הקלט ושומר על
 * קווי המתאר של התכשיט; המידות נגזרות מתמונת הקלט כך שהיחס נשמר.
 * רץ אוטומטית רק בתוך שרשרת ה-Auto-Magic (החלטת מוצר — כל ריצה בתשלום).
 */

// version מוצמד — אומת מול Replicate API (7/2026); owner/name גולמי לא מספיק
const REALISM_MODEL =
  "lucataco/sdxl-controlnet:06d6fae3b75ab68a28cd2900afa6033166910dd09fd9751047043a5bbb4c184b" as const;
const REALISM_MODEL_ID = "lucataco/sdxl-controlnet";

// condition_scale מתון — מספיק חופש להוסיף צל/השתקפות בלי לצייר מחדש את המוצר
const REALISM_CONDITION_SCALE = 0.5;
const REALISM_INFERENCE_STEPS = 30;

export type RealismPipelineInput = {
  /** תוצאת ההרכבה (composite) מ-runBackgroundPipeline */
  compositeUrl: string;
  presetId: string | null;
  customPrompt: string | null;
  mode: "catalog" | "marketing";
};

export type RealismPipelineResult = {
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

function firstUrlFromOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0] as string;
  }
  return null;
}

export async function runRealismPipeline(
  input: RealismPipelineInput
): Promise<RealismPipelineResult> {
  if (!isReplicateConfigured()) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      "Replicate אינו מוגדר — פאס הריאליזם דורש REPLICATE_API_TOKEN"
    );
  }

  const hint = resolveBackgroundHint(input.presetId, input.customPrompt);
  const { output, predictTimeSec } = await runReplicateModel(REALISM_MODEL, {
    image: resizeForAiInput(input.compositeUrl),
    prompt: buildRealismPrompt(hint),
    negative_prompt: REALISM_NEGATIVE_PROMPT,
    condition_scale: REALISM_CONDITION_SCALE,
    num_inference_steps: REALISM_INFERENCE_STEPS,
  });

  const url = firstUrlFromOutput(output);
  if (!url) {
    throw new StudioBetaError(
      "PROVIDER_ERROR",
      "פאס הריאליזם לא החזיר תמונה"
    );
  }

  const buffer = await downloadAsBuffer(url);
  const uploaded = await uploadToCloudinary({
    source: `data:image/png;base64,${buffer.toString("base64")}`,
    resourceType: "image",
    filenamePrefix: "studio-beta-realism",
  });

  await trackAiUsage({
    provider: "replicate",
    capability: "background",
    modelId: REALISM_MODEL_ID,
    mode: input.mode,
    success: true,
    metadata: { app: "studio-beta", kind: "realism", predictTimeSec },
  });

  return {
    resultUrl: uploaded.url,
    modelId: REALISM_MODEL_ID,
    costUsd: estimateCostUsd(REALISM_MODEL_ID, predictTimeSec),
  };
}
