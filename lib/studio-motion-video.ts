import { withCloudinaryTransform } from "@/lib/cloudinary-url";
import { uploadBufferToCloudinary } from "@/lib/studio-replicate";
import { parseStudioVideoDuration, type StudioVideoDurationSec } from "@/lib/studio-video-duration";

/**
 * וידאו קטלוגי מתמונה סטטית — זום עדין בלבד, בלי AI.
 * שומר 100% על צורת התכשיט (אין morphing של Veo/Kling).
 */
export async function generatePreservedMotionVideo(
  compositeImageUrl: string,
  duration: StudioVideoDurationSec = 5
): Promise<{ url: string }> {
  const seconds = parseStudioVideoDuration(duration);
  const transform = [
    `w_1920,c_limit`,
    `e_zoompan:du_${seconds};fps_24;zoom_1.03`,
    `f_mp4`,
    `vc_h264:high`,
    `q_auto:best`,
  ].join(",");

  const motionUrl = withCloudinaryTransform(compositeImageUrl, transform);
  const response = await fetch(motionUrl, {
    signal: AbortSignal.timeout(180_000),
  });

  if (!response.ok) {
    throw new Error(
      `יצירת וידאו קטלוגי נכשלה (${response.status}) — נסו שוב`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 2048) {
    throw new Error("קובץ הווידאו הקטלוגי ריק או פגום");
  }

  const url = await uploadBufferToCloudinary(
    buffer,
    `studio-video-preserve-${Date.now()}.mp4`,
    "video"
  );

  return { url };
}
