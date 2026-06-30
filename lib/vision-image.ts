import { visionAnalysisUrl } from "@/lib/cloudinary-url";

/** כתובות לניתוח — מקור מקורי קודם, אחר כך תמונה מעובדת */
export function collectVisionImageUrls(
  pairs: { originalUrl: string; generatedUrl: string }[]
): string[] {
  const urls: string[] = [];

  for (const pair of pairs) {
    if (pair.originalUrl?.trim()) urls.push(pair.originalUrl.trim());
    if (pair.generatedUrl?.trim()) urls.push(pair.generatedUrl.trim());
  }

  return Array.from(new Set(urls));
}

function prepareFetchUrl(url: string): string {
  if (url.includes("res.cloudinary.com")) {
    return visionAnalysisUrl(url);
  }
  return url;
}

/** מוריד את התמונה ומחזיר data URI — אמין יותר מ-URL חיצוני עבור Replicate */
export async function fetchImageDataUri(url: string): Promise<string> {
  const fetchUrl = prepareFetchUrl(url);
  const response = await fetch(fetchUrl, {
    signal: AbortSignal.timeout(20_000),
    headers: { Accept: "image/*" },
  });

  if (!response.ok) {
    throw new Error(`לא ניתן להוריד את התמונה (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 512) {
    throw new Error("קובץ התמונה ריק או פגום");
  }

  const contentType =
    response.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";

  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
