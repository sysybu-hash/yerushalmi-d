import { pipelineGenerateImage } from "@/lib/studio-pipeline";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import { QuotaExceededError } from "@/lib/ai-usage";
import type { GenerateImageOptions } from "@/lib/studio-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      sourceUrl?: string;
    } & GenerateImageOptions;

    if (!body.sourceUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה כתובת תמונת מקור"),
        "חסרה כתובת תמונת מקור",
        400
      );
    }

    const data = await pipelineGenerateImage(body.sourceUrl.trim(), {
      customPrompt: body.customPrompt,
      stylePreset: body.stylePreset,
      engines: body.engines,
      mode: body.mode,
      cutoutUrl: body.cutoutUrl,
      useAiBackground: body.useAiBackground,
      highQualityBackground: body.highQualityBackground,
      projectId: body.projectId,
    });

    return studioJsonOk(data);
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return studioJsonError(error, error.message, 429);
    }
    return studioJsonError(
      error,
      "יצירת התמונה נכשלה — נסו שוב עם תמונת מקור ברזולוציה גבוהה."
    );
  }
}
