import {
  buildSourceVideoStudioUrl,
  buildZoompanVideoUrl,
} from "@/lib/cloudinary-url";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import { parseStudioVideoDuration, type StudioVideoDurationSec } from "@/lib/studio-video-duration";

async function fetchCloudinaryDelivery(deliveryUrl: string, label: string): Promise<Buffer> {
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
  if (buffer.length < 2048) {
    throw new Error("קובץ הווידאו הקטלוגי ריק או פגום");
  }

  return buffer;
}

/**
 * וידאו קטלוגי מתמונת הרכבה — זום עדין בלבד, בלי AI.
 * שומר 100% על צורת התכשיט (אין morphing של Veo/Kling).
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

  const buffer = await fetchCloudinaryDelivery(motionUrl, "zoompan");
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-video-preserve-${Date.now()}.mp4`,
    "video"
  );

  return { url };
}

/**
 * מיטוב וידאו מקורי — שומר תנועה, משפר חדות וצבע.
 * מומלץ כשמעלים וידאו WhatsApp במקום פריים בודד.
 */
export async function generateProfessionalSourceVideo(
  sourceVideoUrl: string,
  duration: StudioVideoDurationSec = 10
): Promise<{ url: string }> {
  const seconds = parseStudioVideoDuration(duration);
  const deliveryUrl = buildSourceVideoStudioUrl(sourceVideoUrl, seconds, 1080);
  const buffer = await fetchCloudinaryDelivery(deliveryUrl, "source_video");
  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-video-source-${Date.now()}.mp4`,
    "video"
  );

  return { url };
}
