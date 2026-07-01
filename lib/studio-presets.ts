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
      "smooth dark charcoal gradient background, soft warm gold ambient glow, luxury catalog atmosphere, no visible circles or patterns",
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
      "smooth warm amber gradient background, soft golden hour warmth, luxury catalog lighting, no sun rays or radial patterns",
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
    "smooth dark gradient, soft warm gold ambient tone, subtle sparkle on stones only",
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
    "smooth amber gradient warmth, soft honey tones, no rays or radial patterns",
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
  { id: "cutout-preview", label: "בדיקת cutout" },
  { id: "background", label: "בונה רקע יוקרתי" },
  { id: "composite", label: "מרכיב — אותו תכשיט, רקע חדש" },
] as const;

export type StudioPipelineStepId =
  (typeof STUDIO_PIPELINE_STEPS)[number]["id"];

export const DEFAULT_VIDEO_PROMPT =
  "static luxury jewelry product shot, completely frozen background, locked camera, no camera movement, no background animation, no morphing backdrop, subtle micro sparkle on diamond facets only, professional jewelry commercial, soft studio lighting, photorealistic, preserve exact product shape and stone count, seamless smooth gradient backdrop";

export const DEFAULT_VIDEO_NEGATIVE_PROMPT =
  "changing jewelry shape, different ring design, morphing product, extra prongs, missing stones, melted metal, plastic look, camera shake, zoom, orbit, pan, blur, distortion, oversaturated, jitter, low quality, text, watermark, hands, people, horizontal line, seam, split screen, glitch, reflection artifact, black bar, scan line, concentric circles, radial gradient, tunnel effect, target pattern, spinning background, pulsing background, moving bokeh orbs, light rays, sunburst, vortex, kaleidoscope, animated backdrop, background morphing, warping background";

export const STUDIO_VIDEO_PROMPT_EXAMPLES = [
  "מצלמה קבועה, רקע לגמרי סטטי, נצנוץ עדין על היהלומים בלבד",
  "תאורת סטודיו רכה, ללא תנועת מצלמה וללא תזוזת רקע",
  "ברק עדין על הפאות, התכשיט לא זז, הרקע לא משתנה",
  "סגנון קטלוג יוקרתי, רקע חלק וקבוע",
  "נצנוץ מיקרו על אבנים, ללא אנימציה ברקע",
  "תאורה מקצועית, רקע גרדיאנט חלק ללא עיגולים",
] as const;

/** הנחיות תנועה לווידאו — רק נצנוץ על התכשיט, רקע קפוא לחלוטין */
export const STUDIO_VIDEO_PRESET_HINTS: Record<StudioStylePresetId, string> = {
  "luxury-marble":
    "frozen marble backdrop, micro sparkle on diamond facets only, no background movement",
  "black-velvet":
    "static velvet darkness, soft diamond shimmer only, backdrop completely still",
  "white-studio":
    "frozen white seamless backdrop, clean catalog micro sparkle on stones",
  "gold-bokeh":
    "static smooth dark gradient, no pulsing bokeh, micro sparkle on gemstones only",
  lifestyle:
    "still silk fabric backdrop, warm micro sparkle on jewelry facets only",
  "rose-gold-glow":
    "frozen rose gold gradient, no light pulse, gentle facet sparkle only",
  "midnight-blue":
    "static deep blue backdrop, cool micro sparkle on diamonds, no light sweep",
  "champagne-silk":
    "still champagne silk backdrop, soft facet shimmer, no background animation",
  "jerusalem-stone":
    "frozen limestone texture, warm static backdrop, micro stone sparkle only",
  "concrete-minimal":
    "static gray concrete backdrop, clean facet highlights, no warm shift",
  "botanical-soft":
    "frozen soft green gradient, static backdrop, natural micro sparkle on stones",
  "mirror-glass":
    "static glass surface, sharp facet sparkle only, no reflection sweep",
  "royal-purple":
    "frozen purple velvet backdrop, regal micro sparkle on gemstones, no spotlight pulse",
  "sunset-amber":
    "static amber gradient, no sun rays or light sweep, micro facet sparkle only",
};
