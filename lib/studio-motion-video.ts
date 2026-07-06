import {
  buildSourceVideoStudioUrl,
  buildZoompanVideoUrl,
} from "@/lib/cloudinary-url";
import { parseStudioVideoDuration, type StudioVideoDurationSec } from "@/lib/studio-video-duration";

async function verifyCloudinaryDelivery(
  deliveryUrl: string,
  label: string,
  minBytes = 2048
): Promise<void> {
  const response = await fetch(deliveryUrl, {
    signal: AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`studio_${label}_failed`, response.status, detail.slice(0, 500));
    throw new Error(
      `יצירת וידאו קטלוגי נכשלה (${response.status}) — נסו שוב`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < minBytes) {
    throw new Error("קובץ הווידאו הקטלוגי ריק או פגום");
  }
}

/**
 * וידאו קטלוגי מתמונת הרכבה — זום עדין בלבד, בלי AI.
 * מחזיר URL ישירות מ-Cloudinary (ללא העלאה חוזרת — ה-preset לרוב מיועד לתמונות).
 */
export async function generatePreservedMotionVideo(
  compositeImageUrl: string,
  duration: StudioVideoDurationSec = 5
): Promise<{ url: string }> {
  const seconds = parseStudioVideoDuration(duration);
  const motionUrl = buildZoompanVideoUrl(compositeImageUrl, seconds, {
    maxZoom: 1.02,
    fps: 30,
    width: 1920,
  });

  await verifyCloudinaryDelivery(motionUrl, "zoompan");
  return { url: motionUrl };
}

/**
 * מיטוב וידאו מקורי — שומר תנועה, משפר חדות וצבע.
 */
export async function generateProfessionalSourceVideo(
  sourceVideoUrl: string,
  duration: StudioVideoDurationSec = 10
): Promise<{ url: string }> {
  const seconds = parseStudioVideoDuration(duration);
  const deliveryUrl = buildSourceVideoStudioUrl(sourceVideoUrl, seconds, 1080);
  await verifyCloudinaryDelivery(deliveryUrl, "source_video", 4096);
  return { url: deliveryUrl };
}
