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

/** גרסה מוקטנת ל-rembg — מהיר יותר, נכנס במגבלת 10 שניות של Vercel */
export function rembgSourceUrl(cloudinaryUrl: string): string {
  return withCloudinaryTransform(
    cloudinaryUrl,
    "w_1200,h_1200,c_limit,q_auto:good,f_jpg"
  );
}
