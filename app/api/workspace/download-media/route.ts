import { requireAdmin } from "@/lib/auth";
import {
  sanitizeDownloadFilename,
} from "@/lib/download-media";
import { isAllowedProductMediaUrl } from "@/lib/product-images";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();
  const filename = searchParams.get("filename")?.trim();

  if (!url || !filename) {
    return new Response("Missing parameters", { status: 400 });
  }

  if (!isAllowedProductMediaUrl(url)) {
    return new Response("Invalid media URL", { status: 400 });
  }

  const safeName = sanitizeDownloadFilename(filename);

  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch media", { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
