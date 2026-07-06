import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import {
  DEFAULT_VIDEO_ADJUSTMENTS,
  JEWELRY_CATALOG_VIDEO_ADJUSTMENTS,
  buildTransformedUrl,
  type VideoAdjustments,
} from "@/lib/studio-transform";

/** מוזיקת רקע אינסטרומנטלית לווידאו AI — ללא דיבור מהמנוע */
export const AI_VIDEO_INSTRUMENTAL_AUDIO: Pick<
  VideoAdjustments,
  "mute" | "audioStyle" | "audioVolume"
> = {
  mute: false,
  audioStyle: JEWELRY_CATALOG_VIDEO_ADJUSTMENTS.audioStyle,
  audioVolume: JEWELRY_CATALOG_VIDEO_ADJUSTMENTS.audioVolume,
};

async function ensureCloudinaryVideoUrl(
  videoUrl: string,
  label: string
): Promise<string> {
  if (videoUrl.includes("res.cloudinary.com")) return videoUrl;

  const response = await fetch(videoUrl, {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    throw new Error("הורדת הווידאו לעיבוד אודיו נכשלה");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadBufferToCloudinary(
    buffer,
    `${label}-${Date.now()}.mp4`,
    "video"
  );
}

/**
 * מסיר אודיו מקורי (כולל דיבור מ-Veo) ומטמיע מוזיקת רקע אינסטרומנטלית בקובץ.
 */
export async function bakeInstrumentalVideoAudio(
  cloudinaryVideoUrl: string,
  audio: Pick<VideoAdjustments, "mute" | "audioStyle" | "audioVolume"> = AI_VIDEO_INSTRUMENTAL_AUDIO
): Promise<string> {
  const adjustments: VideoAdjustments = {
    ...DEFAULT_VIDEO_ADJUSTMENTS,
    ...audio,
  };

  if (adjustments.audioStyle === "original" && !adjustments.mute) {
    return cloudinaryVideoUrl;
  }

  const transformed = buildTransformedUrl(
    cloudinaryVideoUrl,
    "video",
    adjustments,
    { quality: "best" }
  );

  const response = await fetch(transformed, {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    throw new Error("הטמעת מוזיקת רקע בווידאו נכשלה");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) {
    throw new Error("קובץ הווידאו אחרי עיבוד אודיו ריק או פגום");
  }

  return uploadBufferToCloudinary(
    buffer,
    `studio-video-instrumental-${Date.now()}.mp4`,
    "video"
  );
}

/** העלאה ל-Cloudinary (במידת הצורך) + מוזיקה אינסטרומנטלית ללא דיבור AI */
export async function finalizeAiGeneratedVideo(
  videoUrl: string,
  label = "studio-video-ai"
): Promise<string> {
  const onCloudinary = await ensureCloudinaryVideoUrl(videoUrl, label);
  return bakeInstrumentalVideoAudio(onCloudinary);
}
