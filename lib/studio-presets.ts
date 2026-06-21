import type { SettingKey } from "@/lib/site-settings";
import { COLLECTION_SETTING_KEYS } from "@/lib/site-settings";
import { PRODUCT_CATEGORIES } from "@/components/workspace/product-constants";

function collectionLabel(slug: string) {
  return (
    PRODUCT_CATEGORIES.find((category) => category.value === slug)?.label ??
    slug
  );
}

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

/** רזולוציית פלט לקטלוג / סטודיו */
export const STUDIO_CANVAS_SIZE = 2048;

/** מינימום מומלץ לצילום מקור (פיקסלים בצד הקצר) */
export const STUDIO_MIN_SOURCE_PX = 1200;

/** רמזי תאורה לפי preset — משולבים עם הנחיות המשתמש */
export const STUDIO_PRESET_LIGHTING_HINTS: Record<
  StudioStylePresetId,
  string
> = {
  "luxury-marble":
    "dramatic rim lighting, deep shadows, champagne gold accents, polished surface",
  "black-velvet":
    "soft spotlight, sparkling diamond reflections, velvet display",
  "white-studio":
    "soft diffused catalog lighting, clean white seamless, bright",
  "gold-bokeh":
    "warm gold bokeh, moody cinematic atmosphere, subtle sparkle",
  lifestyle:
    "warm natural editorial light, soft, elegant lifestyle",
};

export const STUDIO_PROMPT_EXAMPLES = [
  "תאורה דרמטית עם השתקפויות זהב — ללא שינוי צבע המתכת",
  "רקע כהה, תאורת סטודיו רכה — מתאים לקטלוג",
  "צילום קטלוגי נקי, בהירות מאוזנת",
  "הדגש נצנוץ יהלומים בלבד, ללא שינוי צורת התכשיט",
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
  ...COLLECTION_SETTING_KEYS.map((c) => ({
    key: c.imageKey,
    label: `באנר — ${collectionLabel(c.slug)}`,
    description: `תמונת באנר לעמוד ${collectionLabel(c.slug)}`,
    previewPath: c.href,
  })),
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
  "static luxury jewelry product shot, locked camera, no camera movement, subtle light sweep across diamond facets only, micro sparkle highlights, professional jewelry commercial, studio lighting, photorealistic, preserve exact product shape and stone count";

export const DEFAULT_VIDEO_NEGATIVE_PROMPT =
  "changing jewelry shape, different ring design, morphing product, extra prongs, missing stones, melted metal, plastic look, camera shake, zoom, orbit, pan, blur, distortion, oversaturated, jitter, low quality, text, watermark, hands, people";

export const STUDIO_VIDEO_PROMPT_EXAMPLES = [
  "מצלמה קבועה, רק נצנוץ אור על היהלומים",
  "תאורת סטודיו רכה, ללא תנועת מצלמה",
  "ברק עדין על הפאות, התכשיט לא זז",
] as const;
