import { pipelineCompositeImage } from "@/lib/studio-pipeline";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import type { GenerateImageOptions } from "@/lib/studio-types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      cutoutUrl?: string;
    } & GenerateImageOptions;

    if (!body.cutoutUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה תמונת cutout"),
        "חסרה תמונת cutout",
        400
      );
    }

    const data = await pipelineCompositeImage(body.cutoutUrl.trim(), {
      customPrompt: body.customPrompt,
      stylePreset: body.stylePreset,
    });
    return studioJsonOk(data);
  } catch (error) {
    return studioJsonError(
      error,
      "הרכבת התמונה נכשלה — נסו צילום עם רקע אחיד."
    );
  }
}
