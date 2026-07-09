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

  if (/unsigned upload|format parameter is not allowed/i.test(trimmed)) {
    return "שגיאת העלאה ל-Cloudinary — נסו שוב.";
  }

  if (/unsupported file type/i.test(trimmed)) {
    return "Cloudinary דוחה את סוג הקובץ — ודאו שה-upload preset מאפשר PNG (תמונות) או הוסיפו CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET ב-Vercel.";
  }

  return trimmed;
}

async function parseStudioResponse<T>(
  response: Response
): Promise<StudioActionResult<T>> {
  const raw = await response.text();
  let body: { ok?: boolean; data?: T; error?: string; retryable?: boolean } =
    {};

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
    retryable: body.retryable ?? [500, 502, 503, 504].includes(response.status),
    status: response.status,
  };
}

/** שגיאת רשת בצד הלקוח — תמיד retryable (הבקשה אולי לא הגיעה לשרת) */
function networkFailure(error: unknown): StudioActionResult<never> {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return {
      ok: false,
      error: "הפעולה נמשכה יותר מדי — נסו שוב",
      retryable: true,
    };
  }
  return {
    ok: false,
    error: humanizeStudioError(
      error instanceof Error ? error.message : "שגיאת רשת"
    ),
    retryable: true,
  };
}

/**
 * timeout לכל קריאת סטודיו — בלעדיו חיבור תקוע משאיר את busyAction
 * נעול והממשק כולו קפוא ללא מוצא. וידאו רץ עד 300 שניות בשרת —
 * מרווח ביטחון של 30 שניות מעבר.
 */
const VIDEO_TIMEOUT_MS = 330_000;
const DEFAULT_TIMEOUT_MS = 150_000;

export async function studioApiRemoveBackground(
  imageUrl: string,
  options: {
    engines?: Partial<AiEngineConfig>;
    mode?: GenerateImageOptions["mode"];
    projectId?: number;
    cutoutUrl?: string;
    idempotencyKey?: string;
    force?: boolean;
  } = {}
): Promise<StudioActionResult<{ url: string; cached?: boolean }>> {
  try {
    const response = await fetch("/api/studio/remove-background", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        engines: options.engines,
        mode: options.mode,
        projectId: options.projectId,
        cutoutUrl: options.cutoutUrl,
        idempotencyKey: options.idempotencyKey,
        force: options.force,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
  }
}

export async function studioApiCompositeImage(
  cutoutUrl: string,
  options: GenerateImageOptions & { idempotencyKey?: string } = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/composite", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, cutoutUrl }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
  }
}

export async function studioApiGenerateImage(
  sourceUrl: string,
  options: GenerateImageOptions & { idempotencyKey?: string } = {}
): Promise<StudioActionResult<StudioGenerateResult>> {
  try {
    const response = await fetch("/api/studio/generate", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, sourceUrl }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
  }
}

export async function studioApiGenerateVideo(
  imageUrl: string,
  options: GenerateVideoOptions & { idempotencyKey?: string } = {}
): Promise<StudioActionResult<{ url: string; provider: "kling" | "veo" | "preserve" }>> {
  try {
    const response = await fetch("/api/studio/video", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(VIDEO_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, ...options }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
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
    idempotencyKey?: string;
  } = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/enhance-video", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(VIDEO_TIMEOUT_MS),
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
        idempotencyKey: options.idempotencyKey,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
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
    idempotencyKey?: string;
  } = {}
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/enhance-source", {
      method: "POST",
      credentials: "same-origin",
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageUrl,
        preset: options.preset,
        customPrompt: options.customPrompt,
        mode: options.mode,
        projectId: options.projectId,
        idempotencyKey: options.idempotencyKey,
      }),
    });
    return parseStudioResponse(response);
  } catch (error) {
    return networkFailure(error);
  }
}
