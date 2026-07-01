import { studioEnhanceSource } from "@/lib/ai-studio-media";
import type { SourceEnhancePreset } from "@/lib/studio-gemini-media";
import {
  studioJsonError,
  studioJsonOk,
  studioRouteGuard,
} from "@/lib/studio-route";
import { QuotaExceededError } from "@/lib/ai-usage";
import type { StudioPipelineMode } from "@/lib/ai-engines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const VALID_PRESETS: SourceEnhancePreset[] = ["complete", "cleanup", "enhance"];

export async function POST(request: Request) {
  const denied = await studioRouteGuard();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      imageUrl?: string;
      preset?: SourceEnhancePreset;
      customPrompt?: string;
      mode?: StudioPipelineMode;
      projectId?: number;
    };

    if (!body.imageUrl?.trim()) {
      return studioJsonError(
        new Error("חסרה כתובת תמונה"),
        "חסרה כתובת תמונה",
        400
      );
    }

    const preset = body.preset ?? "enhance";
    if (!VALID_PRESETS.includes(preset)) {
      return studioJsonError(
        new Error("סוג מיטוב לא תקין"),
        "סוג מיטוב לא תקין",
        400
      );
    }

    const data = await studioEnhanceSource(body.imageUrl.trim(), {
      preset,
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
      "השלמת התמונה ב-AI נכשלה — ודאו ש-GEMINI_API_KEY מוגדר ב-Vercel."
    );
  }
}
