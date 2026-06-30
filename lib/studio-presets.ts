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
  {
    id: "rose-gold-glow",
    label: "זהב ורוד רומנטי",
    suffix:
      "soft rose gold gradient background, romantic warm blush tones, gentle sparkle, feminine luxury jewelry display",
  },
  {
    id: "midnight-blue",
    label: "כחול חצות",
    suffix:
      "deep midnight blue velvet background, cool silver highlights, elegant evening luxury atmosphere",
  },
  {
    id: "champagne-silk",
    label: "משי שמפניה",
    suffix:
      "champagne silk fabric draped background, warm cream tones, soft diffused glow, bridal luxury aesthetic",
  },
  {
    id: "jerusalem-stone",
    label: "אבן ירושלמית",
    suffix:
      "warm Jerusalem limestone texture background, honey beige tones, Mediterranean luxury, soft golden hour light",
  },
  {
    id: "concrete-minimal",
    label: "בטון מינימליסטי",
    suffix:
      "modern light gray concrete surface, minimalist Scandinavian luxury, clean cool studio lighting",
  },
  {
    id: "botanical-soft",
    label: "בוטני רך",
    suffix:
      "soft sage green botanical bokeh background, natural organic luxury, muted greenery blur, fresh editorial style",
  },
  {
    id: "mirror-glass",
    label: "זכוכית מראה",
    suffix:
      "reflective black glass surface, mirror-like reflections, high-end showcase display, sharp studio highlights",
  },
  {
    id: "royal-purple",
    label: "סגול מלכותי",
    suffix:
      "rich royal purple velvet background, regal amethyst tones, dramatic luxury spotlight, evening gala aesthetic",
  },
  {
    id: "sunset-amber",
    label: "שקיעת ענבר",
    suffix:
      "warm sunset amber gradient background, golden hour glow, honey light rays, radiant luxury warmth",
  },
] as const;

export type StudioStylePresetId = (typeof STUDIO_STYLE_PRESETS)[number]["id"];

/** רזולוציית פלט לקטלוג / סטודיו */
export const STUDIO_CANVAS_SIZE = 2048;

/** רזולוציית קלט ל-Bria RMBG — מקסימום לפני cutout, תואם קנבס 2048 */
export const REMBG_MAX_PX = 2048;

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
  "rose-gold-glow":
    "soft rose gold blush glow, romantic warm highlights, gentle sparkle",
  "midnight-blue":
    "cool silver rim light, deep blue atmosphere, evening elegance",
  "champagne-silk":
    "warm champagne silk sheen, soft bridal glow, cream highlights",
  "jerusalem-stone":
    "warm golden hour limestone light, honey beige Mediterranean warmth",
  "concrete-minimal":
    "cool minimal studio light, clean gray concrete, Scandinavian bright",
  "botanical-soft":
    "soft natural green bokeh, organic muted botanical atmosphere",
  "mirror-glass":
    "sharp glass reflections, mirror shine, high contrast studio highlights",
  "royal-purple":
    "dramatic purple velvet spotlight, regal amethyst mood lighting",
  "sunset-amber":
    "warm amber sunset glow, golden hour rays, radiant honey light",
};

export const STUDIO_PROMPT_EXAMPLES = [
  "תאורה דרמטית עם השתקפויות זהב — ללא שינוי צבע המתכת",
  "רקע כהה, תאורת סטודיו רכה — מתאים לקטלוג",
  "צילום קטלוגי נקי, בהירות מאוזנת",
  "הדגש נצנוץ יהלומים בלבד, ללא שינוי צורת התכשיט",
  "אווירה רומנטית עם גוון זהב ורוד עדין",
  "תאורת שקיעה חמה וענברית",
  "סגנון מינימליסטי מודרני, רקע אפור נקי",
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
  "changing jewelry shape, different ring design, morphing product, extra prongs, missing stones, melted metal, plastic look, camera shake, zoom, orbit, pan, blur, distortion, oversaturated, jitter, low quality, text, watermark, hands, people, horizontal line, seam, split screen, glitch, reflection artifact, black bar, scan line";

export const STUDIO_VIDEO_PROMPT_EXAMPLES = [
  "מצלמה קבועה, רק נצנוץ אור על היהלומים",
  "תאורת סטודיו רכה, ללא תנועת מצלמה",
  "ברק עדין על הפאות, התכשיט לא זז",
  "גלישת אור חמה כמו שקיעה, ללא תזוזת מוצר",
  "הבזקי אור קרירים על רקע כהה",
  "נצנוץ עדין בסגנון קטלוג יוקרתי",
] as const;

/** הנחיות תנועה ואווירה לווידאו לפי סגנון הרקע */
export const STUDIO_VIDEO_PRESET_HINTS: Record<StudioStylePresetId, string> = {
  "luxury-marble":
    "subtle light sweep across marble reflections, dramatic rim highlights on metal",
  "black-velvet":
    "soft spotlight shimmer on diamonds, velvet darkness stays still",
  "white-studio":
    "clean catalog sparkle, bright even studio light, no shadows moving",
  "gold-bokeh":
    "warm gold bokeh lights gently pulsing, cinematic micro sparkle on stones",
  lifestyle:
    "warm natural light shimmer, soft editorial glow, fabric stays still",
  "rose-gold-glow":
    "gentle rose gold light pulse, romantic blush shimmer on facets",
  "midnight-blue":
    "cool silver light sweep, deep blue atmosphere, elegant evening sparkle",
  "champagne-silk":
    "soft champagne silk sheen, bridal warm glow on diamonds",
  "jerusalem-stone":
    "warm golden hour light rays, honey limestone warmth, Mediterranean glow",
  "concrete-minimal":
    "cool minimal studio shimmer, clean modern highlights, no warm tint shift",
  "botanical-soft":
    "soft natural green ambient glow, organic fresh sparkle on stones",
  "mirror-glass":
    "sharp glass reflection shimmer, mirror highlight sweep, showcase sparkle",
  "royal-purple":
    "dramatic purple spotlight pulse, regal sparkle on gemstones",
  "sunset-amber":
    "warm amber sunset light rays, golden hour glow sweep across facets",
};
