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

/** מוזיקת רקע חופשית (Mixkit) — מוחלפת על הווידאו דרך Cloudinary */
export const STUDIO_AUDIO_STYLES: StudioAudioStyle[] = [
  {
    id: "none",
    label: "ללא מוזיקת רקע",
    description: "מושתק — מתאים לפרסום שקט או הוספת קריינות",
    fetchUrl: null,
  },
  {
    id: "original",
    label: "אודיו מקורי",
    description: "שומר את הסאונד מהצילום / מה-AI",
    fetchUrl: null,
  },
  {
    id: "luxury",
    label: "יוקרה עדינה",
    description: "פסנתר ומיתרים — קטלוג תכשיטים",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3",
  },
  {
    id: "cinematic",
    label: "קולנועי",
    description: "מתח עדין ואווירה פרימיום",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-dramatic-arcade-tunnel-670.mp3",
  },
  {
    id: "soft",
    label: "רך ואווירתי",
    description: "אמביינט שקט לסטורי וריל",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3",
  },
  {
    id: "upbeat",
    label: "מודרני וקליל",
    description: "קצב עדין לשיווק ברשתות",
    fetchUrl:
      "https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3",
  },
];

export function getAudioStyle(id: VideoAudioStyleId): StudioAudioStyle {
  return (
    STUDIO_AUDIO_STYLES.find((s) => s.id === id) ?? STUDIO_AUDIO_STYLES[0]
  );
}
