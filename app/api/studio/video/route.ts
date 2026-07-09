import { pipelineGenerateVideo } from "@/lib/studio-pipeline";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import {
  IdempotencyConflictError,
  withIdempotency,
} from "@/lib/studio-idempotency";
import type { GenerateVideoOptions } from "@/lib/studio-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      idempotencyKey?: string;
    } & GenerateVideoOptions;

    if (!body.imageUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה תמונת בסיס"),
        "חסרה תמונת בסיס לווידאו",
        400
      );
    }

    const data = await withIdempotency(body.idempotencyKey, () =>
      pipelineGenerateVideo(body.imageUrl!.trim(), body)
    );
    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return studioJsonError(error, error.message, 409);
    }
    console.error("Studio video failed:", error);
    return studioJsonError(
      error,
      "יצירת הווידאו נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel."
    );
  }
}
