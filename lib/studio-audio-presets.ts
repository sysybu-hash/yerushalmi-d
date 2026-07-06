export type VideoAudioStyleId =
  | "none"
  | "original"
  | "luxury"
  | "cinematic"
  | "soft"
  | "upbeat";

export type StudioAudioStyle = {
  id: VideoAudioStyleId;
  label: string;
  description: string;
  fetchUrl: string | null;
};

/** מוזיקת רקע חופשית (Mixkit) — אינסטרומנטלי בלבד, ללא שירה */
export const STUDIO_AUDIO_STYLES: StudioAudioStyle[] = [
  {
    id: "none",
    label: "ללא מוזיקת רקע",
    description: "מושתק — ללא סאונד",
    fetchUrl: null,
  },
  {
    id: "original",
    label: "אודיו מקורי",
    description: "שומר את הסאונד מהקובץ — עלול לכלול דיבור מ-AI",
    fetchUrl: null,
  },
  {
    id: "luxury",
    label: "יוקרה עדינה",
    description: "פסנתר ומיתרים אינסטרומנטליים — ללא מילים",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-sparse-and-minimal-orchestra-416.mp3",
  },
  {
    id: "cinematic",
    label: "קולנועי",
    description: "תזמורת עדינה אינסטרומנטלית — ללא שירה",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-silent-descent-408.mp3",
  },
  {
    id: "soft",
    label: "רך ואווירתי",
    description: "אמביינט שקט אינסטרומנטלי — ללא מילים",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
  },
  {
    id: "upbeat",
    label: "מודרני וקליל",
    description: "קצב עדין אינסטרומנטלי — ללא ווקאל",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-valley-sunset-127.mp3",
  },
];

export function getAudioStyle(id: VideoAudioStyleId): StudioAudioStyle {
  return (
    STUDIO_AUDIO_STYLES.find((s) => s.id === id) ?? STUDIO_AUDIO_STYLES[0]
  );
}
