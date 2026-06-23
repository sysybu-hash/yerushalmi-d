import type { StudioActionResult } from "@/lib/studio-action";
import type { GenerateImageOptions, GenerateVideoOptions } from "@/lib/studio-types";

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
  imageUrl: string
): Promise<StudioActionResult<{ url: string }>> {
  try {
    const response = await fetch("/api/studio/remove-background", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl }),
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
      body: JSON.stringify({ cutoutUrl, ...options }),
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
): Promise<StudioActionResult<{ url: string; provider: "kling" }>> {
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
