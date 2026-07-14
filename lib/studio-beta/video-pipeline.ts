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
  type VideoMotionId,
  type MusicStyleId,
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
import {
  mapDurationForKling,
  mapDurationForVeo,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";
import {
  buildKlingMultiPrompt,
  type MultiShotTemplateId,
} from "@/lib/studio-multishot";
import { opaqueImageUrlForVideo, videoFrameJpgUrl } from "@/lib/cloudinary-url";

export type VideoPipelineInput = {
  imageUrl: string;
  engine: VideoEngineId;
  durationSec: StudioVideoDurationSec;
  customPrompt: string | null;
  mode: "catalog" | "marketing";
  /** מוחל רק על Kling — ל-Veo אין פרמטר כזה בקליינט הקיים */
  negativePrompt?: string | null;
  /** מוחל רק על Kling — אודיו טבעי שנוצר ע"י המודל */
  generateAudio?: boolean;
  /** מוחל רק על Kling — תבנית multi-shot (מספר צילומים בקליפ אחד) */
  multiShotTemplate?: MultiShotTemplateId;
  /** מוחל רק על המנוע החינמי (cloudinary-preserve) — סגנונות תנועת Ken Burns, ניתנים לשילוב (למשל זום+פאן) */
  motion?: VideoMotionId[];
  /** מוחל רק על המנוע החינמי (cloudinary-preserve) — מוזיקת רקע חינמית */
  musicStyle?: MusicStyleId;
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
    const url = zoompanFromImage(
      input.imageUrl,
      input.durationSec,
      input.motion,
      input.musicStyle
    );
    return {
      resultUrl: url,
      engine: input.engine,
      modelId: "cloudinary-zoompan",
      costUsd: 0,
      mediaKind: "video",
    };
  }

  if (input.engine === "kling-v3") {
    const negativePrompt = [DEFAULT_VIDEO_NEGATIVE_PROMPT, input.negativePrompt]
      .filter(Boolean)
      .join(", ");
    const klingDuration = mapDurationForKling(input.durationSec);
    const multiPrompt = buildKlingMultiPrompt(
      input.multiShotTemplate ?? "none",
      klingDuration,
      JEWELRY_STRUCTURE_LOCK
    );
    const { output, predictTimeSec } = await runReplicateModel(
      "kwaivgi/kling-v3-video",
      {
        start_image: resizeForAiInput(input.imageUrl),
        prompt,
        negative_prompt: negativePrompt,
        duration: klingDuration,
        generate_audio: Boolean(input.generateAudio),
        ...(multiPrompt ? { multi_prompt: multiPrompt } : {}),
      }
    );
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
      metadata: {
        app: "studio-beta",
        predictTimeSec,
        ...(multiPrompt ? { multiShot: input.multiShotTemplate } : {}),
      },
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
    durationSec: mapDurationForVeo(input.durationSec),
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

export type VideoEnhancePipelineInput = {
  videoUrl: string;
  mode: "catalog" | "marketing";
};

export type VideoEnhancePipelineResult = {
  resultUrl: string;
  modelId: string;
  costUsd: number;
};

const VIDEO_ENHANCE_PROMPT =
  "Luxury jewelry product video on opaque solid studio background, static camera, micro sparkle on existing facets only, professional catalog lighting";

/** משך קבוע לפעולת שיפור — זו פעולת פוליש חד-פעמית, לא יצירה מחדש עם בחירת משתמש */
const VIDEO_ENHANCE_DURATION_SEC = 6;

/**
 * שיפור וידאו קיים ב-Veo: מפריים מהוידאו הנוכחי, יוצר מחדש דרך Veo Pro
 * (איכות עדיפה על מהירות כאן). לא אופה מוזיקה — זו פעולת בטא נפרדת מהמוזיקה
 * החינמית הקיימת (cloudinary-transform.ts), לא צנרת ה-Mixkit השבורה של v2.
 */
export async function runVideoEnhancePipeline(
  input: VideoEnhancePipelineInput
): Promise<VideoEnhancePipelineResult> {
  if (!isGeminiConfigured()) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      "Gemini (Veo) אינו מוגדר במערכת"
    );
  }
  if (!input.videoUrl.includes("res.cloudinary.com")) {
    throw new StudioBetaError(
      "VALIDATION",
      "שיפור AI דורש וידאו שהועלה ל-Cloudinary"
    );
  }

  const frameUrl = videoFrameJpgUrl(input.videoUrl, 0);
  const veoInputUrl = opaqueImageUrlForVideo(frameUrl);
  const prompt = [
    JEWELRY_STRUCTURE_LOCK,
    VIDEO_ENHANCE_PROMPT,
    "The entire frame must be fully opaque with a continuous solid background — no transparency, no alpha holes, no checkerboard.",
  ].join(" ");

  const sourceBuffer = await downloadAsBuffer(veoInputUrl);
  const { videoUrl: generatedUrl, modelId } = await generateVeoVideo({
    prompt,
    imageDataUri: bufferToDataUri(sourceBuffer, "image/jpeg"),
    durationSec: VIDEO_ENHANCE_DURATION_SEC,
    fast: false,
  });

  const videoBuffer = await downloadAsBuffer(generatedUrl);
  const uploaded = await uploadToCloudinary({
    source: bufferToDataUri(videoBuffer, "video/mp4"),
    resourceType: "video",
    filenamePrefix: "studio-beta-video-enhance",
  });

  await trackAiUsage({
    provider: "gemini",
    capability: "video",
    modelId,
    mode: input.mode,
    success: true,
    metadata: { app: "studio-beta", kind: "video-enhance" },
  });

  return {
    resultUrl: uploaded.url,
    modelId,
    costUsd: estimateCostUsd(modelId, null),
  };
}
