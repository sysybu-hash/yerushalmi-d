/** בנק 6 הרקעים הנבחרים לסטודיו בטא — בנוי במלואו (לא stub) */

export type BackgroundPreset = {
  id: string;
  label: string;
  /** צבע מייצג לתצוגה מקדימה ברשת הבחירה */
  swatch: string;
  /** רמז תיאורי באנגלית — מוזרק לפרומפט ה-AI */
  hint: string;
};

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "white-studio",
    label: "סטודיו לבן",
    swatch: "#F7F5F1",
    hint: "soft diffused catalog lighting on a clean white seamless background, bright and even",
  },
  {
    id: "luxury-marble",
    label: "שיש יוקרתי",
    swatch: "#D9D2C4",
    hint: "polished marble surface, dramatic rim lighting, deep shadows, champagne gold accents",
  },
  {
    id: "black-velvet",
    label: "קטיפה שחורה",
    swatch: "#15120F",
    hint: "soft spotlight on a black velvet display, sparkling diamond reflections",
  },
  {
    id: "gold-bokeh",
    label: "בוקה זהב",
    swatch: "#A9843F",
    hint: "smooth dark gradient with a soft warm gold ambient bokeh, subtle sparkle on the stones only",
  },
  {
    id: "champagne-silk",
    label: "משי שמפניה",
    swatch: "#E7D9BE",
    hint: "warm champagne silk sheen backdrop, soft bridal glow, cream highlights",
  },
  {
    id: "lifestyle",
    label: "לייף-סטייל",
    swatch: "#C9B79C",
    hint: "warm natural editorial lighting, soft elegant lifestyle setting",
  },
];

export function getBackgroundPreset(id: string): BackgroundPreset | undefined {
  return BACKGROUND_PRESETS.find((preset) => preset.id === id);
}

/** בונה רמז-רקע מפריסט נבחר או מתיאור חופשי של המשתמש */
export function resolveBackgroundHint(
  presetId: string | null,
  customPrompt: string | null
): string {
  const custom = customPrompt?.trim();
  if (custom) return custom;
  const preset = presetId ? getBackgroundPreset(presetId) : undefined;
  return preset?.hint ?? BACKGROUND_PRESETS[0].hint;
}
