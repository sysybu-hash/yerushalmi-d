import type { VideoAudioStyleId } from "@/lib/studio-audio-presets";
import { getAudioStyle } from "@/lib/studio-audio-presets";

const audioPublicIdCache = new Map<VideoAudioStyleId, string>();

function publicIdForStyle(styleId: VideoAudioStyleId): string {
  return `yerushalmi-studio/music/${styleId}`;
}

/** מזהה שכבת אודיו ב-URL של Cloudinary (מקף → נקודתיים) */
export function cloudinaryAudioLayerId(publicId: string): string {
  return publicId.replace(/\//g, ":");
}

/**
 * מעלה מוזיקת Mixkit ל-Cloudinary (resource_type=video) — נדרש ל-overlay.
 * Cloudinary לא תומך ב-l_fetch לאודיו מרוחק.
 */
export async function ensureStudioAudioOnCloudinary(
  styleId: VideoAudioStyleId
): Promise<string | null> {
  if (styleId === "none" || styleId === "original") return null;

  const cached = audioPublicIdCache.get(styleId);
  if (cached) return cached;

  const style = getAudioStyle(styleId);
  if (!style.fetchUrl) return null;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary לא מוגדר — בדקו את משתני הסביבה");
  }

  const publicId = publicIdForStyle(styleId);
  const form = new FormData();
  form.append("file", style.fetchUrl);
  form.append("upload_preset", uploadPreset);
  form.append("public_id", publicId);
  form.append("resource_type", "video");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: form, signal: AbortSignal.timeout(120_000) }
  );

  const json = (await response.json()) as {
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.public_id) {
    throw new Error(
      json.error?.message ??
        `העלאת מוזיקת הרקע (${style.label}) ל-Cloudinary נכשלה`
    );
  }

  audioPublicIdCache.set(styleId, json.public_id);
  return json.public_id;
}
