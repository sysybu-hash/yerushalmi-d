import { estimateCostUsd } from "@/lib/ai-cost-rates";
import { trackAiUsage } from "@/lib/ai-usage";
import { attemptCutout, type CutoutResult } from "@/lib/studio-beta/cutout";
import {
  compositeOnBackground,
  generateProceduralBackground,
  type BackdropPlacement,
  type CompositePlacement,
} from "@/lib/studio-beta/composite";
import { resolveBackgroundHint } from "@/lib/studio-beta/backgrounds";
import {
  BACKGROUND_ONLY_NEGATIVE_PROMPT,
  buildBackgroundOnlyPrompt,
  buildGeminiComposePrompt,
} from "@/lib/studio-beta/prompts";
import {
  isReplicateConfigured,
  runReplicateModel,
} from "@/lib/studio-beta/replicate-client";
import {
  generateOrEditImage,
  isGeminiConfigured,
} from "@/lib/studio-beta/gemini-client";
import { uploadToCloudinary } from "@/lib/studio-beta/cloudinary-upload";
import {
  aspectToFluxParam,
  aspectToSdxlDimensions,
  resizeForAiInput,
  type SourceAspect,
} from "@/lib/studio-beta/cloudinary-transform";
import {
  getBackgroundEngine,
  isEngineAvailable,
  type BackgroundEngineId,
} from "@/lib/studio-beta/engines";
import { StudioBetaError } from "@/lib/studio-beta/errors";

export type BackgroundPipelineInput = {
  sourceImageUrl: string;
  engine: BackgroundEngineId;
  presetId: string | null;
  customPrompt: string | null;
  mode: "catalog" | "marketing";
  /** בידוד שכבר בוצע ואושר ידנית (שער ה-cutout) — מדלג על attemptCutout הפנימי */
  precomputedCutoutUrl?: string | null;
  /** מיקום/גודל ידניים שנקבעו בפאנל התצוגה המקדימה — ראו lib/studio-beta/composite.ts */
  placement?: CompositePlacement | null;
  /** זום/פאן ידניים על שכבת הרקע עצמה */
  backdropPlacement?: BackdropPlacement | null;
  /** יחס התמונה הנבחר — קובע את מידות הרקע שנוצר (Flux/SDXL/פרוצדורלי) */
  sourceAspect?: SourceAspect;
};

export type BackgroundPipelineResult = {
  resultUrl: string;
  engine: string;
  modelId: string;
  costUsd: number;
  usedCutout: boolean;
  fallbackNote: string | null;
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

function firstUrlFromOutput(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output) && typeof output[0] === "string") {
    return output[0] as string;
  }
  return null;
}

async function composeDirectlyWithGemini(
  sourceImageUrl: string,
  hint: string,
  mode: "catalog" | "marketing",
  extraMetadata?: Record<string, unknown>
) {
  const sourceBuffer = await downloadAsBuffer(resizeForAiInput(sourceImageUrl));
  const { dataUri, modelId } = await generateOrEditImage({
    prompt: buildGeminiComposePrompt(hint),
    imageDataUri: bufferToDataUri(sourceBuffer),
  });
  const uploaded = await uploadToCloudinary({
    source: dataUri,
    resourceType: "image",
    filenamePrefix: "studio-beta-background-compose",
  });
  await trackAiUsage({
    provider: "gemini",
    capability: "background",
    modelId,
    mode,
    success: true,
    metadata: { app: "studio-beta", ...extraMetadata },
  });
  return { uploaded, modelId };
}

/**
 * שלב 2 של הזרימה: רקע + הרכבה. עובד עם תמונת מקור כלשהי — בידוד הוא
 * ניסיון פנימי best-effort בלבד ולעולם לא חוסם. אם הוא נכשל, נופלים
 * ל-Gemini compose ישירות על התמונה המקורית; אם גם זה לא זמין, מרכיבים
 * את התמונה המקורית כמו שהיא ומסמנים fallbackNote — אבל תמיד מחזירים
 * תוצאה, אף פעם לא שגיאה חוסמת.
 */
export async function runBackgroundPipeline(
  input: BackgroundPipelineInput
): Promise<BackgroundPipelineResult> {
  const engine = getBackgroundEngine(input.engine);
  if (!engine) {
    throw new StudioBetaError("VALIDATION", "מנוע רקע לא מוכר");
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

  const hint = resolveBackgroundHint(input.presetId, input.customPrompt);

  if (input.engine === "gemini-compose") {
    const { uploaded, modelId } = await composeDirectlyWithGemini(
      input.sourceImageUrl,
      hint,
      input.mode
    );
    return {
      resultUrl: uploaded.url,
      engine: input.engine,
      modelId,
      costUsd: estimateCostUsd(modelId, null),
      usedCutout: false,
      fallbackNote: null,
    };
  }

  const aspect = input.sourceAspect ?? "original";
  const dims = aspectToSdxlDimensions(aspect);

  const { buffer: backgroundBuffer, predictTimeSec: backgroundPredictTimeSec } =
    await (async () => {
      if (input.engine === "procedural") {
        return {
          buffer: await generateProceduralBackground(
            input.presetId,
            dims.width,
            dims.height
          ),
          predictTimeSec: null,
        };
      }
      // sdxl דורש version מוצמד — ה-owner/name הגולמי מחזיר 404 ב-Replicate
      const model =
        input.engine === "flux-schnell"
          ? "black-forest-labs/flux-schnell"
          : "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc";
      const { output, predictTimeSec } = await runReplicateModel(
        model,
        input.engine === "flux-schnell"
          ? {
              prompt: buildBackgroundOnlyPrompt(hint),
              // Flux מקבל aspect_ratio ישירות (אומת מול הסכמה) — עדיף על width/height
              aspect_ratio: aspectToFluxParam(aspect),
            }
          : {
              prompt: buildBackgroundOnlyPrompt(hint),
              negative_prompt: BACKGROUND_ONLY_NEGATIVE_PROMPT,
              // SDXL buckets לפי היחס הנבחר — הקנבס ב-composite נגזר מהרקע
              width: dims.width,
              height: dims.height,
            }
      );
      const url = firstUrlFromOutput(output);
      if (!url) {
        throw new StudioBetaError(
          "PROVIDER_ERROR",
          `${engine.label} לא החזיר תמונה`
        );
      }
      return { buffer: await downloadAsBuffer(url), predictTimeSec };
    })();

  const cutout: CutoutResult = input.precomputedCutoutUrl
    ? {
        url: input.precomputedCutoutUrl,
        method: "manual",
        modelId: "manual-cutout-gate",
        costUsd: 0,
      }
    : await attemptCutout(input.sourceImageUrl, input.mode);

  if (cutout) {
    const cutoutBuffer = await downloadAsBuffer(cutout.url);
    const composited = await compositeOnBackground(
      cutoutBuffer,
      backgroundBuffer,
      input.placement ?? undefined,
      input.backdropPlacement ?? undefined
    );
    const uploaded = await uploadToCloudinary({
      source: bufferToDataUri(composited),
      resourceType: "image",
      filenamePrefix: "studio-beta-composite",
    });
    if (engine.costModelId) {
      await trackAiUsage({
        provider: engine.provider === "replicate" ? "replicate" : "gemini",
        capability: "background",
        modelId: engine.costModelId,
        mode: input.mode,
        success: true,
        metadata: { app: "studio-beta", predictTimeSec: backgroundPredictTimeSec },
      });
    }
    return {
      resultUrl: uploaded.url,
      engine: input.engine,
      modelId: engine.costModelId ?? "procedural",
      costUsd: estimateCostUsd(engine.costModelId ?? "", backgroundPredictTimeSec),
      usedCutout: true,
      fallbackNote: null,
    };
  }

  // בידוד נכשל — לא חוסמים, נופלים ל-Gemini compose על התמונה המקורית
  if (isGeminiConfigured()) {
    const { uploaded, modelId } = await composeDirectlyWithGemini(
      input.sourceImageUrl,
      hint,
      input.mode,
      { fallbackFrom: input.engine }
    );
    return {
      resultUrl: uploaded.url,
      engine: input.engine,
      modelId,
      costUsd: estimateCostUsd(modelId, null),
      usedCutout: false,
      fallbackNote:
        "הבידוד האוטומטי לא הצליח — התכשיט הורכב ישירות מהתמונה המקורית",
    };
  }

  // מוצא אחרון — מרכיבים את התמונה המקורית כמו שהיא, לעולם לא חוסמים
  const rawBuffer = await downloadAsBuffer(input.sourceImageUrl);
  const composited = await compositeOnBackground(
    rawBuffer,
    backgroundBuffer,
    input.placement ?? undefined,
    input.backdropPlacement ?? undefined
  );
  const uploaded = await uploadToCloudinary({
    source: bufferToDataUri(composited),
    resourceType: "image",
    filenamePrefix: "studio-beta-composite-raw",
  });
  return {
    resultUrl: uploaded.url,
    engine: input.engine,
    modelId: engine.costModelId ?? "procedural",
    costUsd: 0,
    usedCutout: false,
    fallbackNote: "בוצע בלי בידוד — ייתכן שהרקע המקורי גלוי בשוליים",
  };
}
