import { REMBG_MAX_PX } from "@/lib/studio-presets";

/** הוספת טרנספורמציית Cloudinary ל-URL קיים (אחרי /upload/) */
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

/** גרסה מותאמת ל-rembg — איכות גבוהה מספיק לפלט 2048px, PNG לשמירת קצוות */
export function rembgSourceUrl(cloudinaryUrl: string): string {
  return withCloudinaryTransform(
    cloudinaryUrl,
    `w_${REMBG_MAX_PX},h_${REMBG_MAX_PX},c_limit,q_95,f_png`
  );
}
