import { pipelineRemoveBackground } from "@/lib/studio-pipeline-remove-bg";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import type { AiEngineConfig } from "@/lib/ai-engines";

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
    };
    if (!body.imageUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה כתובת תמונה"),
        "חסרה כתובת תמונה",
        400
      );
    }

    const data = await pipelineRemoveBackground(
      body.imageUrl.trim(),
      body.engines
    );
    return studioJsonOk(data);
  } catch (error) {
    return studioJsonError(
      error,
      "הסרת הרקע נכשלה — ודאו ש-REPLICATE_API_TOKEN מוגדר ב-Vercel."
    );
  }
}
