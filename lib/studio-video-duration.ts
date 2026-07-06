/** אורכי וידאו זמינים בסטודיו (Kling / Veo) */
export type StudioVideoDurationSec = 4 | 5 | 6 | 8 | 10;

export const STUDIO_VIDEO_DURATION_OPTIONS: {
  value: StudioVideoDurationSec;
  label: string;
  hint: string;
}[] = [
  { value: 4, label: "4 שניות", hint: "Veo — קצר ומהיר" },
  { value: 5, label: "5 שניות", hint: "Kling / Veo" },
  { value: 6, label: "6 שניות", hint: "Veo — ברירת מחדל מומלצת" },
  { value: 8, label: "8 שניות", hint: "Veo — מקסימום ל-Pro 1080p" },
  { value: 10, label: "10 שניות", hint: "Kling — קליפ ארוך" },
];

export function parseStudioVideoDuration(
  value: number | string | null | undefined
): StudioVideoDurationSec {
  const n = typeof value === "string" ? Number(value) : value;
  if (n === 4 || n === 5 || n === 6 || n === 8 || n === 10) return n;
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

/** Kling תומך ב-5 או 10 שניות */
export function mapDurationForKling(
  duration: StudioVideoDurationSec
): 5 | 10 {
  return duration >= 8 ? 10 : 5;
}
