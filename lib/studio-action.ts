import { normalizeStudioError } from "@/lib/studio-replicate";

export type StudioActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function runStudioAction<T>(
  fn: () => Promise<T>,
  fallback: string
): Promise<StudioActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const message = normalizeStudioError(error, fallback);
    if (message === "Unauthorized") {
      return { ok: false, error: "פג תוקף ההתחברות — התחברו מחדש דרך /login" };
    }
    if (message === "JWT_SECRET is not set") {
      return {
        ok: false,
        error: "JWT_SECRET חסר ב-Vercel — הוסיפו משתנה סביבה לסביבת Production.",
      };
    }
    return { ok: false, error: message };
  }
}
