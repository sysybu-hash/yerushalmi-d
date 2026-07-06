import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import { ensureStudioAudioOnCloudinary } from "@/lib/studio-audio-cloudinary";
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

async function bakeMutedVideo(cloudinaryVideoUrl: string): Promise<string> {
  const transformed = buildTransformedUrl(
    cloudinaryVideoUrl,
    "video",
    { ...DEFAULT_VIDEO_ADJUSTMENTS, mute: true, audioStyle: "none" },
    { quality: "best" }
  );

  const response = await fetch(transformed, {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    throw new Error("השתקת הווידאו נכשלה");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return uploadBufferToCloudinary(
    buffer,
    `studio-video-muted-${Date.now()}.mp4`,
    "video"
  );
}

/**
 * מסיר אודיו מקורי ומטמיע מוזיקת רקע אינסטרומנטלית (דרך l_audio ב-Cloudinary).
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

  if (adjustments.mute || adjustments.audioStyle === "none") {
    return bakeMutedVideo(cloudinaryVideoUrl);
  }

  const audioPublicId = await ensureStudioAudioOnCloudinary(
    adjustments.audioStyle
  );
  if (!audioPublicId) {
    return bakeMutedVideo(cloudinaryVideoUrl);
  }

  const transformed = buildTransformedUrl(
    cloudinaryVideoUrl,
    "video",
    adjustments,
    { quality: "best", audioPublicId }
  );

  const response = await fetch(transformed, {
    signal: AbortSignal.timeout(180_000),
  });
  if (!response.ok) {
    console.warn("studio_audio_overlay_failed", response.status);
    return bakeMutedVideo(cloudinaryVideoUrl);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) {
    return bakeMutedVideo(cloudinaryVideoUrl);
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
  try {
    return await bakeInstrumentalVideoAudio(onCloudinary);
  } catch (error) {
    console.warn("studio_finalize_video_audio_failed", error);
    try {
      return await bakeMutedVideo(onCloudinary);
    } catch {
      return onCloudinary;
    }
  }
}
