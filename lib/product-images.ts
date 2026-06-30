const ALLOWED_IMAGE_HOSTS = [
  "https://res.cloudinary.com/",
  "https://replicate.delivery/",
] as const;

const REPLICATE_SUBDOMAIN =
  /^https:\/\/[\w-]+\.replicate\.delivery\//;

/** בדיקת כתובת תמונת מוצר — Cloudinary או Replicate בלבד */
export function isAllowedProductImageUrl(url: string): boolean {
  return (
    ALLOWED_IMAGE_HOSTS.some((host) => url.startsWith(host)) ||
    REPLICATE_SUBDOMAIN.test(url)
  );
}

/** בדיקת כתובת מדיה (תמונה/וידאו) — Cloudinary או Replicate בלבד */
export function isAllowedProductMediaUrl(url: string): boolean {
  return isAllowedProductImageUrl(url);
}

export function parseOptionalProductImageUrl(
  raw: FormDataEntryValue | null,
  fieldLabel: string
): string | null {
  const url = raw?.toString().trim() || null;
  if (!url) return null;
  if (!isAllowedProductImageUrl(url)) {
    throw new Error(`כתובת ${fieldLabel} אינה תקינה`);
  }
  return url;
}

/** סימון נסתר לזיהוי מוצרי דמו בסקריפט seed */
export const DEMO_PRODUCT_MARKER = "[seed:demo-v1]";

export function isDemoProductDescription(description: string | null): boolean {
  return Boolean(description?.includes(DEMO_PRODUCT_MARKER));
}
