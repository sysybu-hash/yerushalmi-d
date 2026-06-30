import { isAllowedProductMediaUrl } from "@/lib/product-images";

export type MediaDownloadType = "image" | "video";

/** שם קובץ ASCII בטוח — עובד בכל מכשיר */
export function buildMediaFilename(
  type: MediaDownloadType,
  options?: { title?: string | null; id?: number }
): string {
  const slug = options?.title
    ?.trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  if (slug && /^[a-zA-Z0-9-]+$/.test(slug)) {
    return type === "video" ? `${slug}.mp4` : `${slug}.jpg`;
  }

  if (options?.id) {
    return type === "video"
      ? `yerushalmi-video-${options.id}.mp4`
      : `yerushalmi-image-${options.id}.jpg`;
  }

  return type === "video" ? "yerushalmi-video.mp4" : "yerushalmi-image.jpg";
}

export function sanitizeDownloadFilename(filename: string): string {
  const cleaned = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/\.+/g, ".");

  if (!cleaned || cleaned === "." || cleaned === "..") {
    return "yerushalmi-media.bin";
  }

  return cleaned;
}

export function buildDownloadProxyUrl(url: string, filename: string): string {
  const params = new URLSearchParams({
    url,
    filename: sanitizeDownloadFilename(filename),
  });
  return `/api/workspace/download-media?${params.toString()}`;
}

function cloudinaryAttachmentUrl(url: string, filename: string): string {
  if (!url.includes("res.cloudinary.com")) return url;

  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;

  const head = url.slice(0, index + marker.length);
  const tail = url.slice(index + marker.length);
  const baseName = sanitizeDownloadFilename(filename).replace(/\.[a-z0-9]+$/i, "");
  const flag = `fl_attachment:${baseName}`;

  if (tail.startsWith("fl_attachment")) return url;

  return `${head}${flag}/${tail}`;
}

/** הורדת תמונה/וידאו למכשיר — שם קובץ ברור דרך שרת האתר */
export async function downloadMediaAsset(
  url: string,
  type: MediaDownloadType,
  filename?: string
): Promise<void> {
  if (!isAllowedProductMediaUrl(url)) {
    throw new Error("כתובת המדיה אינה תקינה");
  }

  const name = sanitizeDownloadFilename(
    filename ?? buildMediaFilename(type)
  );
  const proxyUrl = buildDownloadProxyUrl(url, name);

  const response = await fetch(proxyUrl, { credentials: "include" });
  if (!response.ok) {
    throw new Error("ההורדה נכשלה — נסו שוב");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadMediaAssets(
  items: Array<{
    url: string;
    type: MediaDownloadType;
    title?: string | null;
    id?: number;
  }>
): Promise<void> {
  for (const item of items) {
    await downloadMediaAsset(
      item.url,
      item.type,
      buildMediaFilename(item.type, { title: item.title, id: item.id })
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

export { cloudinaryAttachmentUrl };
