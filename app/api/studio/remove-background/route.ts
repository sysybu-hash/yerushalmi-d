import { pipelineRemoveBackground } from "@/lib/studio-pipeline-remove-bg";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import {
  IdempotencyConflictError,
  withIdempotency,
} from "@/lib/studio-idempotency";
import type { AiEngineConfig, StudioPipelineMode } from "@/lib/ai-engines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      engines?: Partial<AiEngineConfig>;
      mode?: StudioPipelineMode;
      projectId?: number;
      cutoutUrl?: string;
      idempotencyKey?: string;
      force?: boolean;
    };
    if (!body.imageUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה כתובת תמונה"),
        "חסרה כתובת תמונה",
        400
      );
    }

    const data = await withIdempotency(body.idempotencyKey, () =>
      pipelineRemoveBackground(body.imageUrl!.trim(), body.engines, {
        mode: body.mode,
        projectId: body.projectId,
        cutoutUrl: body.cutoutUrl,
        force: body.force,
      })
    );
    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return studioJsonError(error, error.message, 409);
    }
    return studioJsonError(
      error,
      "הסרת הרקע נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel."
    );
  }
}
