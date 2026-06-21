/**
 * בניית כתובות Cloudinary עם טרנספורמציות — למיטוב ועריכה של
 * תמונות ווידאו קיימים בסטודיו. אין כאן AI: רק עיבוד דטרמיניסטי
 * (חיתוך, חידוד, בהירות, רוויה, פורמט/איכות אוטומטיים, חיתוך וידאו).
 *
 * כל אפקט נבנה כרכיב טרנספורמציה נפרד (מופרד ב-"/") — כך Cloudinary
 * מיישם את כולם בשרשרת בצורה אמינה.
 */

export type MediaResourceType = "image" | "video";

export type AspectId = "original" | "1:1" | "4:5" | "9:16" | "16:9";

export const ASPECT_OPTIONS: { id: AspectId; label: string }[] = [
  { id: "original", label: "מקורי" },
  { id: "1:1", label: "ריבוע 1:1 (פוסט)" },
  { id: "4:5", label: "פורטרט 4:5" },
  { id: "9:16", label: "סטורי / ריל 9:16" },
  { id: "16:9", label: "רוחב 16:9" },
];

export type ImageAdjustments = {
  autoEnhance: boolean;
  autoColor: boolean;
  sharpen: boolean;
  brightness: number; // -50..50
  saturation: number; // -50..50
  contrast: number; // -50..50
  aspect: AspectId;
  upscale: boolean;
};

export type VideoAdjustments = {
  aspect: AspectId;
  mute: boolean;
  brightness: number; // -50..50
  saturation: number; // -50..50
  trimStart: number | null; // שניות
  trimEnd: number | null; // שניות
};

export const DEFAULT_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  autoEnhance: true,
  autoColor: true,
  sharpen: true,
  brightness: 0,
  saturation: 0,
  contrast: 5,
  aspect: "original",
  upscale: true,
};

/** פריסט מומלץ לקטלוג תכשיטים */
export const JEWELRY_CATALOG_IMAGE_ADJUSTMENTS: ImageAdjustments = {
  autoEnhance: true,
  autoColor: true,
  sharpen: true,
  brightness: 5,
  saturation: -5,
  contrast: 8,
  aspect: "1:1",
  upscale: false,
};

export const DEFAULT_VIDEO_ADJUSTMENTS: VideoAdjustments = {
  aspect: "original",
  mute: false,
  brightness: 0,
  saturation: 0,
  trimStart: null,
  trimEnd: null,
};

function aspectComponent(aspect: AspectId): string | null {
  if (aspect === "original") return null;
  return `c_fill,g_auto,ar_${aspect}`;
}

/** רכיבי הטרנספורמציה לתמונה (ללא חלק האיכות שמתווסף בנפרד) */
function imageComponents(adj: ImageAdjustments): string[] {
  const parts: string[] = [];
  if (adj.autoEnhance) parts.push("e_improve");
  if (adj.autoColor) parts.push("e_auto_color");
  if (adj.sharpen) parts.push("e_sharpen:100");
  if (adj.brightness !== 0) parts.push(`e_brightness:${adj.brightness}`);
  if (adj.saturation !== 0) parts.push(`e_saturation:${adj.saturation}`);
  if (adj.contrast !== 0) parts.push(`e_contrast:${adj.contrast}`);

  const aspect = aspectComponent(adj.aspect);
  if (aspect) parts.push(aspect);
  else if (adj.upscale) parts.push("c_limit,w_2500");

  return parts;
}

/** רכיבי הטרנספורמציה לווידאו */
function videoComponents(adj: VideoAdjustments): string[] {
  const parts: string[] = [];

  const trim: string[] = [];
  if (adj.trimStart != null && adj.trimStart > 0) {
    trim.push(`so_${adj.trimStart}`);
  }
  if (adj.trimEnd != null && adj.trimEnd > 0) {
    trim.push(`eo_${adj.trimEnd}`);
  }
  if (trim.length) parts.push(trim.join(","));

  const aspect = aspectComponent(adj.aspect);
  if (aspect) parts.push(aspect);

  if (adj.mute) parts.push("ac_none");
  if (adj.brightness !== 0) parts.push(`e_brightness:${adj.brightness}`);
  if (adj.saturation !== 0) parts.push(`e_saturation:${adj.saturation}`);

  return parts;
}

/** הזרקת מחרוזת טרנספורמציה לכתובת Cloudinary אחרי /upload/ */
function injectTransform(url: string, transform: string): string {
  if (!transform) return url;
  const marker = "/upload/";
  const i = url.indexOf(marker);
  if (i === -1) return url;
  const head = url.slice(0, i + marker.length);
  const tail = url.slice(i + marker.length);
  return `${head}${transform}/${tail}`;
}

/** האם הוחל מיטוב כלשהו (להצגת מצב "נערך") */
export function hasImageEdits(adj: ImageAdjustments): boolean {
  return imageComponents(adj).length > 0;
}

export function hasVideoEdits(adj: VideoAdjustments): boolean {
  return videoComponents(adj).length > 0;
}

/**
 * בניית הכתובת הסופית עם הטרנספורמציות.
 * `download` מוסיף fl_attachment כדי לכפות הורדת קובץ.
 */
export function buildTransformedUrl(
  secureUrl: string,
  type: MediaResourceType,
  adjustments: ImageAdjustments | VideoAdjustments,
  options: { download?: boolean; quality?: "good" | "best" } = {}
): string {
  const components: string[] = [];

  const imageQuality =
    options.quality === "best" ? "q_auto:best" : "q_auto:good";
  components.push(
    type === "image" ? `f_auto,${imageQuality}` : "f_auto,q_auto:best"
  );

  const effectParts =
    type === "image"
      ? imageComponents(adjustments as ImageAdjustments)
      : videoComponents(adjustments as VideoAdjustments);

  components.push(...effectParts);

  if (options.download) {
    components.push("fl_attachment");
  }

  return injectTransform(secureUrl, components.join("/"));
}
