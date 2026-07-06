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

/** נתיב הנכס אחרי /upload/ ללא טרנספורמציות (כולל גרסה v123 אם קיימת) */
export function cloudinaryUploadTail(secureUrl: string): string {
  const marker = "/upload/";
  const idx = secureUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error("כתובת Cloudinary לא תקינה");
  }

  const segments = secureUrl.slice(idx + marker.length).split("/");
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    if (/^v\d+$/.test(seg)) break;
    if (
      seg.includes(",") ||
      /^[a-z]{1,3}_/i.test(seg) ||
      seg.startsWith("fl_") ||
      seg.startsWith("e_")
    ) {
      i++;
      continue;
    }
    break;
  }

  return segments.slice(i).join("/");
}

/**
 * וידאו Ken Burns מתמונה סטטית — דורש image/upload + fl_animated + סיומת .mp4
 * @see https://cloudinary.com/documentation/transformation_reference#e_zoompan
 */
export function buildZoompanVideoUrl(
  imageUrl: string,
  durationSec: number,
  options: { maxZoom?: number; fps?: number } = {}
): string {
  const marker = "/image/upload/";
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) {
    throw new Error("נדרשת תמונת Cloudinary ליצירת וידאו קטלוגי");
  }

  const prefix = imageUrl.slice(0, idx + marker.length);
  const tail = cloudinaryUploadTail(imageUrl).replace(/\.[^./]+$/, ".mp4");
  const maxZoom = options.maxZoom ?? 1.05;
  const fps = options.fps ?? 24;
  const zoompan = `e_zoompan:du_${durationSec};maxzoom_${maxZoom};fps_${fps};to_(g_auto)`;

  return `${prefix}${zoompan}/fl_animated/q_auto:best/${tail}`;
}
