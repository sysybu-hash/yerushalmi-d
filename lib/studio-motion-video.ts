import {
  buildSourceVideoStudioUrl,
  buildZoompanVideoUrl,
} from "@/lib/cloudinary-url";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import { parseStudioVideoDuration, type StudioVideoDurationSec } from "@/lib/studio-video-duration";

async function fetchCloudinaryDeliveryBuffer(
  deliveryUrl: string,
  label: string,
  minBytes = 2048
): Promise<Buffer> {
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

  return buffer;
}

/**
 * וידאו קטלוגי מתמונת הרכבה — זום עדין בלבד, בלי AI.
 * מוריד את ה-MP4 מ-zoompan ומעלה ל-/video/upload לתצוגה תקינה בדפדפן.
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

  const buffer = await fetchCloudinaryDeliveryBuffer(motionUrl, "zoompan");

  try {
    const url = await uploadBufferToCloudinary(
      buffer,
      `studio-video-preserve-${Date.now()}.mp4`,
      "video"
    );
    return { url };
  } catch (uploadError) {
    console.warn("studio_video_upload_fallback", uploadError);
    return { url: motionUrl };
  }
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
  await fetchCloudinaryDeliveryBuffer(deliveryUrl, "source_video", 4096);
  return { url: deliveryUrl };
}
