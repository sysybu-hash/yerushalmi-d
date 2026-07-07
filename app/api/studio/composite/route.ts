import { pipelineCompositeImage } from "@/lib/studio-pipeline";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import { QuotaExceededError } from "@/lib/ai-usage";
import {
  IdempotencyConflictError,
  withIdempotency,
} from "@/lib/studio-idempotency";
import type { GenerateImageOptions } from "@/lib/studio-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      cutoutUrl?: string;
      idempotencyKey?: string;
    } & GenerateImageOptions;

    if (!body.cutoutUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה תמונת cutout"),
        "חסרה תמונת cutout",
        400
      );
    }

    const data = await withIdempotency(body.idempotencyKey, () =>
      pipelineCompositeImage(body.cutoutUrl!.trim(), {
        customPrompt: body.customPrompt,
        stylePreset: body.stylePreset,
        engines: body.engines,
        mode: body.mode,
        useAiBackground: body.useAiBackground,
        highQualityBackground: body.highQualityBackground,
        forVideo: body.forVideo,
        projectId: body.projectId,
      })
    );
    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return studioJsonError(error, error.message, 409);
    }
    if (error instanceof QuotaExceededError) {
      return studioJsonError(error, error.message, 429);
    }
    return studioJsonError(
      error,
      "הרכבת התמונה נכשלה — נסו צילום עם רקע אחיד."
    );
  }
}
