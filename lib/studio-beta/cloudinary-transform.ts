/**
 * בניית URL-ים לטרנספורמציות Cloudinary — קבועים עצמאיים לסטודיו בטא,
 * ללא import מקבצי הסטודיו הישן (lib/studio-presets.ts).
 *
 * שתי מלכודות מהאפיון שחשוב לשמר כאן:
 * 1. f_png בשרשרת טרנספורמציה גובר על סיומת .mp4 (וידאו יוגש כ-PNG) —
 *    לכן פונקציות הווידאו כאן לעולם לא מוסיפות f_png.
 * 2. g_auto על וידאו גורם ל-423 אסינכרוני — תמיד g_center.
 */

const BETA_AI_INPUT_MAX_PX = 2048;

function insertTransform(cloudinaryUrl: string, transform: string): string {
  const marker = "/upload/";
  const idx = cloudinaryUrl.indexOf(marker);
  if (idx === -1) {
    // לא URL של Cloudinary — מחזירים כמו שהוא, נטפל בזה כשלב ולידציה במקום אחר
    return cloudinaryUrl;
  }
  const insertAt = idx + marker.length;
  return (
    cloudinaryUrl.slice(0, insertAt) +
    transform +
    "/" +
    cloudinaryUrl.slice(insertAt)
  );
}

/** מכין תמונת מקור לשליחה למודל AI: גודל מוגבל, PNG, איכות מלאה */
export function resizeForAiInput(cloudinaryUrl: string): string {
  return insertTransform(
    cloudinaryUrl,
    `c_limit,w_${BETA_AI_INPUT_MAX_PX},h_${BETA_AI_INPUT_MAX_PX},q_100,f_png`
  );
}

/**
 * תנועת Ken Burns חינמית על תמונה בודדת — וידאו mp4 אמיתי, לא GIF.
 * נשאר תחת אותו נכס image/upload (Cloudinary לא מאפשר לגשת אליו דרך
 * video/upload — 404), רק עם fl_animated וסיומת .mp4. שלוש מלכודות:
 * בלי f_ מפורש בשרשרת (למשל f_png) — Cloudinary מכבד פורמט מפורש
 * ומתעלם מסיומת ה-.mp4, ומחזיר תמונה סטטית במקום וידאו; בלי g_auto
 * (גורם ל-423 אסינכרוני על וידאו); ובלי תוסף `to_(...)` ל-e_zoompan —
 * נבדק בפועל שהוא הופך את הזום לסטטי-לגמרי בתמונות מסוימות (כמו שרשרת
 * דקה על רקע כהה) בלי שגיאה גלויה. הצורה הפשוטה (maxzoom+du+fps בלבד,
 * בלי from/to) היא היחידה שאומתה כעובדת באופן עקבי.
 */
export function zoompanFromImage(
  cloudinaryUrl: string,
  durationSec: number
): string {
  const seconds = Math.max(1, Math.round(durationSec));
  // maxzoom 1.02 (2%) הוא בלתי מורגש כמעט לגמרי — נראה כמו "לא קורה כלום".
  // 1.2 (20%) נותן תנועת Ken Burns שרואים בבירור לאורך משך הקליפ.
  // קנבס עבודה גדול (1600) לפני הזום נותן יותר פרטים למדגם ממנו, גם
  // כשה-delivery הסופי מוגבל (בפועל: תקרת רזולוציה של Cloudinary לוידאו
  // מונפש מ-image/upload היא 720x720 — בלי קשר לגודל המבוקש; ביקשנו גם
  // 1080 וגם 2048 וקיבלנו תמיד 720). לכן מבקשים 720 מפורשות אחרי הזום
  // במקום להסתמך על ברירת המחדל (שיצאה 640 — נמוכה מהתקרה בפועל).
  const flatten = "c_limit,w_1600,h_1600,b_white,q_100";
  const zoompan = `e_zoompan:du_${seconds};maxzoom_1.2;fps_30`;
  const deliverySize = "c_limit,w_720,h_720";
  const transform = `${flatten}/${zoompan}/${deliverySize}/fl_animated/q_auto:best`;
  const withTransform = insertTransform(cloudinaryUrl, transform);
  return withTransform.replace(/\.[a-zA-Z0-9]+$/, ".mp4");
}

/** שיפור חינמי לוידאו שהועלה — ללא f_png, g_center תמיד */
export function enhanceUploadedVideo(cloudinaryUrl: string): string {
  return insertTransform(
    cloudinaryUrl,
    "e_improve,e_denoise:40,e_sharpen:50,g_center"
  );
}

export type SourceAspect = "original" | "1:1" | "4:5" | "9:16" | "16:9";

/** חיתוך תמונת המקור ליחס נבחר — ללא AI, חינמי */
export function cropToAspect(cloudinaryUrl: string, aspect: SourceAspect): string {
  if (aspect === "original") return cloudinaryUrl;
  return insertTransform(cloudinaryUrl, `c_fill,g_auto,ar_${aspect}`);
}

export type SourceAdjustments = {
  /** -50..50 */
  brightness: number;
  /** -50..50 */
  saturation: number;
  /** -50..50 */
  contrast: number;
  autoEnhance: boolean;
};

export function areAdjustmentsDefault(adjustments: SourceAdjustments): boolean {
  return (
    !adjustments.autoEnhance &&
    adjustments.brightness === 0 &&
    adjustments.saturation === 0 &&
    adjustments.contrast === 0
  );
}

/** כיוונון תמונה חינמי (בהירות/רוויה/קונטרסט + שיפור אוטומטי) — ללא AI */
export function adjustImage(
  cloudinaryUrl: string,
  adjustments: SourceAdjustments
): string {
  if (areAdjustmentsDefault(adjustments)) return cloudinaryUrl;
  const parts: string[] = [];
  if (adjustments.autoEnhance) parts.push("e_improve", "e_sharpen:50");
  if (adjustments.brightness) parts.push(`e_brightness:${adjustments.brightness}`);
  if (adjustments.saturation) parts.push(`e_saturation:${adjustments.saturation}`);
  if (adjustments.contrast) parts.push(`e_contrast:${adjustments.contrast}`);
  return insertTransform(cloudinaryUrl, parts.join(","));
}

/**
 * תמונת המקור בפועל שנשלחת להרכבה — כיוונון + חיתוך יחס יחד. הסדר לא
 * משפיע כאן על התוצאה החזותית (כיוונון הוא פר-פיקסל, לא תלוי בחיתוך).
 */
export function getEffectiveSourceUrl(
  cloudinaryUrl: string,
  aspect: SourceAspect,
  adjustments: SourceAdjustments
): string {
  return cropToAspect(adjustImage(cloudinaryUrl, adjustments), aspect);
}

/** חיתוך וידאו (שניות) — חינמי, לא רלוונטי ל-GIF (Ken Burns) */
export function trimVideo(
  cloudinaryUrl: string,
  startSec: number | null,
  endSec: number | null
): string {
  if (startSec == null && endSec == null) return cloudinaryUrl;
  const parts: string[] = [];
  if (startSec != null) parts.push(`so_${startSec}`);
  if (endSec != null) parts.push(`eo_${endSec}`);
  return insertTransform(cloudinaryUrl, parts.join(","));
}

/** השתקת אודיו בווידאו — חינמי */
export function muteVideo(cloudinaryUrl: string): string {
  return insertTransform(cloudinaryUrl, "ac_none");
}

/** מוסיף fl_attachment כדי שהדפדפן יוריד את הקובץ במקום לנסות לפתוח אותו */
export function withDownloadFlag(cloudinaryUrl: string): string {
  return insertTransform(cloudinaryUrl, "fl_attachment");
}
