import { REMBG_MAX_PX } from "@/lib/studio-presets";
export function withCloudinaryTransform(
  url: string,
  transform: string
): string {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const afterUpload = url.slice(idx + marker.length);
  if (afterUpload.startsWith("v") || /^[\w-]+,/.test(afterUpload)) {
    return `${url.slice(0, idx + marker.length)}${transform}/${afterUpload}`;
  }

  return url;
}

/** גרסה מותאמת לניתוח AI — קטן ומהיר, נגיש ל-LLaVA */
export function visionAnalysisUrl(cloudinaryUrl: string): string {
  return withCloudinaryTransform(
    cloudinaryUrl,
    "w_1280,h_1280,c_limit,q_auto,f_jpg"
  );
}

/** פריים מווידאו Cloudinary כ-JPEG לעיבוד AI */
export function videoFrameJpgUrl(
  cloudinaryVideoUrl: string,
  offsetSec = 0,
  maxWidth = REMBG_MAX_PX
): string {
  return withCloudinaryTransform(
    cloudinaryVideoUrl,
    `so_${Math.max(0, offsetSec)},w_${maxWidth},c_limit,f_jpg,q_auto:best`
  );
}

/** מרכיב תמונה אטומה ל-Veo — מבטל אלפא (משבצות שקיפות) */
export function opaqueImageUrlForVideo(cloudinaryUrl: string): string {
  return withCloudinaryTransform(
    cloudinaryUrl,
    `b_white,c_limit,w_${REMBG_MAX_PX},h_${REMBG_MAX_PX},f_jpg,q_auto:best`
  );
}

/** גרסה מותאמת ל-Bria RMBG — מגדילה תמונות קטנות, מקטינה גדולות, PNG מלא */
export function rembgSourceUrl(cloudinaryUrl: string): string {
  return withCloudinaryTransform(
    cloudinaryUrl,
    `w_${REMBG_MAX_PX},q_100,f_png`
  );
}
