import type { SettingKey } from "@/lib/site-settings";

export const STUDIO_STYLE_PRESETS = [
  {
    id: "luxury-marble",
    label: "שיש שחור יוקרתי",
    suffix:
      "on polished black marble surface, dramatic rim lighting, deep shadows, champagne gold accents",
  },
  {
    id: "black-velvet",
    label: "קטיפה שחורה",
    suffix:
      "on black velvet jewelry display, soft spotlight, sparkling diamond reflections",
  },
  {
    id: "white-studio",
    label: "סטודיו לבן נקי",
    suffix:
      "on pure white seamless studio background, soft diffused lighting, catalog style",
  },
  {
    id: "gold-bokeh",
    label: "זהב ובוקה",
    suffix:
      "dark moody background with warm gold bokeh lights, cinematic luxury atmosphere",
  },
  {
    id: "lifestyle",
    label: "לייפסטייל אלגנטי",
    suffix:
      "elegant lifestyle product shot, subtle silk fabric, warm natural light, editorial magazine style",
  },
] as const;

export type StudioStylePresetId = (typeof STUDIO_STYLE_PRESETS)[number]["id"];

export const STUDIO_PROMPT_EXAMPLES = [
  "תאורה דרמטית עם השתקפויות זהב",
  "רקע כהה ודרמטי, תאורה קולנועית",
  "צילום קטלוגי נקי — מתאים לחנות אונליין",
  "הדגש ברק ונצנוץ (רק ברקע/תאורה)",
] as const;

export const STUDIO_WORKSPACE_UPLOAD_MODES = [
  {
    id: "site-banner",
    label: "באנר / מודעה באתר",
    description: "Hero, באנרי קולקציות או תמונת \"הסיפור שלנו\"",
  },
  {
    id: "product-catalog",
    label: "מוצר חדש במלאי",
    description: "הוספת תכשיט לקטלוג החנות עם התמונה שנוצרה",
  },
] as const;

export type StudioWorkspaceUploadModeId =
  (typeof STUDIO_WORKSPACE_UPLOAD_MODES)[number]["id"];

export const STUDIO_PUBLISH_TARGETS: {
  key: SettingKey;
  label: string;
  description: string;
  previewPath: string;
}[] = [
  {
    key: "heroImage",
    label: "תמונת Hero — דף הבית",
    description: "רקע גדול בראש דף הבית",
    previewPath: "/",
  },
  {
    key: "categoryRingsImage",
    label: "באנר קולקציית טבעות",
    description: "כרטיס / באנר בדף טבעות",
    previewPath: "/collections/rings",
  },
  {
    key: "categoryBraceletsImage",
    label: "באנר קולקציית צמידים",
    description: "כרטיס / באנר בדף צמידים",
    previewPath: "/collections/bracelets",
  },
  {
    key: "categoryNecklacesImage",
    label: "באנר תליונים ושרשראות",
    description: "כרטיס / באנר בדף שרשראות",
    previewPath: "/collections/necklaces",
  },
  {
    key: "categoryCustomImage",
    label: "באנר עיצוב אישי",
    description: "כרטיס / באנר בעיצוב אישי",
    previewPath: "/collections/custom",
  },
  {
    key: "aboutImage",
    label: "תמונת \"הסיפור שלנו\"",
    description: "תמונת הסקציה בדף הבית",
    previewPath: "/#about",
  },
];

export const IMAGE_SETTING_KEYS = new Set<SettingKey>(
  STUDIO_PUBLISH_TARGETS.map((t) => t.key)
);

export function styleSuffix(presetId: StudioStylePresetId) {
  return (
    STUDIO_STYLE_PRESETS.find((p) => p.id === presetId)?.suffix ??
    STUDIO_STYLE_PRESETS[0].suffix
  );
}

export const STUDIO_PIPELINE_STEPS = [
  { id: "cutout", label: "מבודד את התכשיט המקורי" },
  { id: "background", label: "בונה רקע יוקרתי (ללא AI)" },
  { id: "composite", label: "מרכיב — אותו תכשיט, רקע חדש" },
] as const;

export type StudioPipelineStepId =
  (typeof STUDIO_PIPELINE_STEPS)[number]["id"];

export const DEFAULT_VIDEO_PROMPT =
  "cinematic slow orbit around luxury diamond jewelry, sparkling light reflections, professional jewelry commercial, shallow depth of field, elegant smooth motion, studio lighting";

export const STUDIO_VIDEO_PROMPT_EXAMPLES = [
  "סיבוב איטי סביב התכשיט, נצנוץ יהלומים",
  "תאורה דרמטית עם השתקפויות זהב",
  "קליפ פרסומת יוקרתי, תנועה עדינה",
] as const;
