/** משכי וידאו נתמכים בסטודיו */
export type StudioVideoDurationSec = 4 | 5 | 6 | 8 | 10 | 12 | 15;

export const STUDIO_VIDEO_DURATION_OPTIONS: {
  value: StudioVideoDurationSec;
  label: string;
  hint: string;
}[] = [
  { value: 4, label: "4 שניות", hint: "Veo — קצר ומהיר" },
  { value: 5, label: "5 שניות", hint: "Kling / Veo" },
  { value: 6, label: "6 שניות", hint: "Veo — ברירת מחדל מומלצת" },
  { value: 8, label: "8 שניות", hint: "מקסימום ל-Veo" },
  { value: 10, label: "10 שניות", hint: "Kling — קליפ ארוך" },
  { value: 12, label: "12 שניות", hint: "Kling בלבד (Veo יתקצר ל-8)" },
  { value: 15, label: "15 שניות", hint: "Kling בלבד — המקסימום (Veo יתקצר ל-8)" },
];

const VALID_DURATIONS: readonly number[] = [4, 5, 6, 8, 10, 12, 15];

export function parseStudioVideoDuration(
  value: number | string | null | undefined
): StudioVideoDurationSec {
  const n = typeof value === "string" ? Number(value) : value;
  if (n != null && VALID_DURATIONS.includes(n)) {
    return n as StudioVideoDurationSec;
  }
  return 5;
}

/** Veo תומך רק ב-4, 6 או 8 שניות */
export function mapDurationForVeo(
  duration: StudioVideoDurationSec
): 4 | 6 | 8 {
  if (duration <= 4) return 4;
  if (duration <= 6) return 6;
  return 8;
}

/** Kling 3 תומך ב-3–15 שניות (שלמים) — מעבירים כמו שהוא */
export function mapDurationForKling(duration: StudioVideoDurationSec): number {
  return Math.max(3, Math.min(15, Math.round(duration)));
}
