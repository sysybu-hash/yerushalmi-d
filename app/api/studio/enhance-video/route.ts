import { studioEnhanceVideo } from "@/lib/studio-video-enhance";
import type {
  VideoEnhancePreset,
  VideoEnhanceProvider,
} from "@/lib/studio-video-enhance";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import { QuotaExceededError } from "@/lib/ai-usage";
import type { StudioPipelineMode } from "@/lib/ai-engines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_PRESETS: VideoEnhancePreset[] = [
  "stabilize",
  "sharpen",
  "color",
  "catalog",
];

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      videoUrl?: string;
      preset?: VideoEnhancePreset;
      provider?: VideoEnhanceProvider;
      customPrompt?: string;
      mode?: StudioPipelineMode;
      projectId?: number;
    };

    if (!body.videoUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה כתובת וידאו"),
        "חסרה כתובת וידאו",
        400
      );
    }

    const preset = body.preset ?? "catalog";
    if (!VALID_PRESETS.includes(preset)) {
      return studioJsonError(
        new Error("סוג מיטוב לא תקין"),
        "סוג מיטוב לא תקין",
        400
      );
    }

    const data = await studioEnhanceVideo(body.videoUrl.trim(), {
      preset,
      provider: body.provider,
      customPrompt: body.customPrompt,
      mode: body.mode,
      projectId: body.projectId,
    });

    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return studioJsonError(error, error.message, 429);
    }
    return studioJsonError(
      error,
      "מיטוב הווידאו נכשל — נסו שוב או קצרו את הקליפ."
    );
  }
}
