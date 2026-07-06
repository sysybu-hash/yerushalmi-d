import type { StudioActionResult } from "@/lib/studio-action";
import type {
  GenerateImageOptions,
  GenerateVideoOptions,
  StudioGenerateResult,
} from "@/lib/studio-types";
import type { AiEngineConfig } from "@/lib/ai-engines";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import type { StudioVideoDurationSec } from "@/lib/studio-video-duration";

const GENERIC_PRODUCTION_ERROR =
  "An error occurred in the Server Components render";

export function humanizeStudioError(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "היצירה נכשלה — נסו שוב בעוד רגע";

  if (
    trimmed.includes(GENERIC_PRODUCTION_ERROR) ||
    trimmed.includes("digest") ||
    trimmed.includes("Failed to fetch") ||
    trimmed.includes("NetworkError")
  ) {
    return "היצירה נכשלה — ייתכן שהפעולה ארכה יותר מדי. נסו שוב; אם הבעיה נמשכת, בדקו REPLICATE_API_TOKEN ב-Vercel.";
  }

  if (trimmed.includes("504") || /timeout/i.test(trimmed)) {
    return "הפעולה ארכה יותר מדי — נסו שוב עם תמונה קטנה יותר או שדרגו את תוכנית Vercel.";
  }

  return trimmed;
}

async function parseStudioResponse<T>(
  response: Response
): Promise<StudioActionResult<T>> {
  const raw = await response.text();
  let body: { ok?: boolean; data?: T; error?: string } = {};

  try {
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    const snippet = raw.trim().slice(0, 80).toLowerCase();
    if (snippet.startsWith("<!doctype") || snippet.startsWith("<html")) {
      return {
        ok: false,
        error: humanizeStudioError(
          response.status === 401
            ? "פג תוקף ההתחברות — התחברו מחדש דרך /login"
            : "השרת החזיר תשובה לא תקינה — נסו להתחבר מחדש"
        ),
      };
    }

    return {
      ok: false,
      error: humanizeStudioError(
        response.status === 504
          ? "timeout"
          : `שגיאת שרת (${response.status})`
      ),
    };
  }

  if (body.ok === true && body.data !== undefined) {
    return { ok: true, data: body.data };
  }

  return {
    ok: false,
    error: humanizeStudioError(
      body.error ?? `שגיאת שרת (${response.status})`
    ),
  };
}

export async function studioApiRemoveBackground(
  imageUrl: string,
  options: {
    engines?: Partial<AiEngineConfig>;
    mode?: GenerateImageOptions["mode"];
    projectId?: number;
    cutoutUrl?: string;
  } = {}
): Promise<StudioActionResult<{ url: string; cached?: boolean }>> {
  try {
    const response = await fetch("/api/studio/remove-background", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        engines: options.engines,
        mode: options.mode,
        projectId: options.projectId,
        cutoutUrl: options.cutoutUrl,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}

export async function studioApiCompositeImage(
  cutoutUrl: string,
  options: GenerateImageOptions = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/composite", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, cutoutUrl }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}

export async function studioApiGenerateImage(
  sourceUrl: string,
  options: GenerateImageOptions = {}
): Promise<StudioActionResult<StudioGenerateResult>> {
  try {
    const response = await fetch("/api/studio/generate", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, sourceUrl }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}

export async function studioApiGenerateVideo(
  imageUrl: string,
  options: GenerateVideoOptions = {}
): Promise<StudioActionResult<{ url: string; provider: "kling" | "veo" }>> {
  try {
    const response = await fetch("/api/studio/video", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, ...options }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}

export type VideoEnhancePreset = "stabilize" | "sharpen" | "color" | "catalog";
export type VideoEnhanceProvider = "cloudinary" | "gemini";

export async function studioApiEnhanceVideo(
  videoUrl: string,
  options: {
    preset?: VideoEnhancePreset;
    provider?: VideoEnhanceProvider;
    customPrompt?: string;
    duration?: StudioVideoDurationSec;
    stylePreset?: StudioStylePresetId;
    mode?: GenerateImageOptions["mode"];
    projectId?: number;
  } = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/enhance-video", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoUrl,
        preset: options.preset,
        provider: options.provider,
        customPrompt: options.customPrompt,
        duration: options.duration,
        stylePreset: options.stylePreset,
        mode: options.mode,
        projectId: options.projectId,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}
export type SourceEnhancePreset = "complete" | "cleanup" | "enhance";

export async function studioApiEnhanceSource(
  imageUrl: string,
  options: {
    preset?: SourceEnhancePreset;
    customPrompt?: string;
    mode?: GenerateImageOptions["mode"];
    projectId?: number;
  } = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/enhance-source", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        preset: options.preset,
        customPrompt: options.customPrompt,
        mode: options.mode,
        projectId: options.projectId,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return {
      ok: false,
      error: humanizeStudioError(
        error instanceof Error ? error.message : "שגיאת רשת"
      ),
    };
  }
}
