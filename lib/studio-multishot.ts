/**
 * תבניות מולטי-שוט ל-Kling 3 — עד 6 צילומים בקליפ אחד.
 * פרומפטים באנגלית מוכנים מראש (בלי תרגום בזמן ריצה), משקלים יחסיים למשך.
 */

export type MultiShotTemplateId = "none" | "hero-orbit" | "detail-reveal" | "showcase";

type MultiShotShot = {
  prompt: string;
  /** חלק יחסי מהמשך הכולל */
  weight: number;
};

export const MULTISHOT_TEMPLATES: {
  id: Exclude<MultiShotTemplateId, "none">;
  label: string;
  description: string;
  shots: MultiShotShot[];
}[] = [
  {
    id: "hero-orbit",
    label: "זום → סיבוב עדין",
    description: "פתיחה בזום איטי על האבן, מעבר לסיבוב עדין של כל התכשיט",
    shots: [
      {
        prompt:
          "Slow gentle push-in toward the center gemstone, micro sparkle on facets, locked jewelry geometry, static background",
        weight: 0.5,
      },
      {
        prompt:
          "Subtle slow orbital camera drift around the jewelry piece, soft studio light sweep on metal, product frozen in place, static background",
        weight: 0.5,
      },
    ],
  },
  {
    id: "detail-reveal",
    label: "פרט → תמונה מלאה",
    description: "מתחיל קרוב על השיבוץ, נפתח לאט לתצוגה מלאה של התכשיט",
    shots: [
      {
        prompt:
          "Extreme close-up on the diamond setting and prongs, crisp macro detail, micro sparkle only, camera locked",
        weight: 0.4,
      },
      {
        prompt:
          "Slow smooth pull-back revealing the entire jewelry piece centered in frame, elegant studio lighting, static background",
        weight: 0.6,
      },
    ],
  },
  {
    id: "showcase",
    label: "תצוגת יוקרה (3 צילומים)",
    description: "זום פנימה → החלקת תאורה על המתכת → מבט מלא יציב",
    shots: [
      {
        prompt:
          "Slow cinematic push-in on the jewelry, gentle diamond sparkle, locked geometry",
        weight: 0.35,
      },
      {
        prompt:
          "Soft light sweep gliding across the polished metal and stones, camera locked, background completely still",
        weight: 0.35,
      },
      {
        prompt:
          "Steady full view of the jewelry piece, subtle micro sparkle on facets only, luxury commercial ending frame",
        weight: 0.3,
      },
    ],
  },
];

/**
 * בונה JSON של multi_prompt ל-Kling: משכי הצילומים שלמים (מינימום 1 שנ'),
 * והסכום שווה בדיוק למשך הכולל — דרישת הסכימה.
 */
export function buildKlingMultiPrompt(
  templateId: MultiShotTemplateId,
  totalDuration: number,
  structureLock: string
): string | null {
  if (templateId === "none") return null;
  const template = MULTISHOT_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const shots = template.shots;
  // חלוקה לשניות שלמות עם תיקון שארית לצילום האחרון
  const durations = shots.map((shot) =>
    Math.max(1, Math.round(shot.weight * totalDuration))
  );
  let diff = totalDuration - durations.reduce((a, b) => a + b, 0);
  for (let i = durations.length - 1; diff !== 0 && i >= 0; i--) {
    const step = diff > 0 ? 1 : -1;
    if (durations[i] + step >= 1) {
      durations[i] += step;
      diff -= step;
    }
  }
  if (durations.reduce((a, b) => a + b, 0) !== totalDuration) return null;

  return JSON.stringify(
    shots.map((shot, i) => ({
      prompt: `${structureLock}. ${shot.prompt}`,
      duration: durations[i],
    }))
  );
}
