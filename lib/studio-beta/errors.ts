/**
 * שגיאות ספק ל-AI Studio Beta — כל שגיאה נושאת הודעת עברית ברורה למשתמש.
 * שום קריאת AI לא נופלת בשקט לתוצאה שבורה: 402/quota ממופה להודעה מפורשת.
 */

export type StudioBetaErrorCode =
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_NO_CREDIT"
  | "PROVIDER_ERROR"
  | "IN_PROGRESS"
  | "VALIDATION";

export class StudioBetaError extends Error {
  code: StudioBetaErrorCode;

  constructor(code: StudioBetaErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "StudioBetaError";
  }
}

const NO_CREDIT_PATTERN =
  /402|401|insufficient credit|unauthorized|rate limit|billing|payment|out of credits|quota/i;

/** ממפה שגיאת ספק גולמית להודעת עברית ברורה — לעולם לא 500 גנרי חשוך */
export function mapProviderError(
  providerLabel: string,
  error: unknown
): StudioBetaError {
  const raw = error instanceof Error ? error.message : String(error);

  if (NO_CREDIT_PATTERN.test(raw)) {
    return new StudioBetaError(
      "PROVIDER_NO_CREDIT",
      `אין יתרה/הרשאה אצל ${providerLabel} — נסו מנוע אחר או בדקו את חשבון הספק. (${raw})`
    );
  }

  return new StudioBetaError(
    "PROVIDER_ERROR",
    `שגיאה מ-${providerLabel}: ${raw}`
  );
}
