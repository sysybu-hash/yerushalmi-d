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
import {
  IdempotencyConflictError,
  withIdempotency,
} from "@/lib/studio-idempotency";
import type { StudioPipelineMode } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";

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
      duration?: StudioVideoDurationSec;
      stylePreset?: StudioStylePresetId;
      mode?: StudioPipelineMode;
      projectId?: number;
      idempotencyKey?: string;
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

    const data = await withIdempotency(body.idempotencyKey, () =>
      studioEnhanceVideo(body.videoUrl!.trim(), {
        preset,
        provider: body.provider,
        customPrompt: body.customPrompt,
        duration: body.duration,
        stylePreset: body.stylePreset,
        mode: body.mode,
        projectId: body.projectId,
      })
    );

    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return studioJsonError(error, error.message, 409);
    }
    return studioJsonError(
      error,
      "מיטוב הווידאו נכשל — נסו שוב או קצרו את הקליפ."
    );
  }
}
