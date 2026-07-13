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
 * פריסטים לתנועת Ken Burns — נבדקו בפועל אחד-אחד מול Cloudinary אמיתי
 * (לא רק תיאוריה): g_center בתוך from_/to_ הופך את האפקט לסטטי-לגמרי
 * בלי שגיאה גלויה; הצורה הפשוטה של maxzoom (בלי from/to) עובדת תמיד;
 * from_/to_ עם gravity כיווני (g_west/g_east/g_north/g_south) עובד גם
 * הוא. **שילוב זום+פאן יחד ב-from_/to_ אחד גם עובד ואומת בפועל** (בדיקת
 * diff פיקסלים בין הפריים הראשון והאחרון הראתה תנועה אמיתית, בעוצמה
 * דומה לפריסטים הבודדים) — כל עוד ה-gravity משתנה בין ההתחלה לסוף (זה
 * מה שמפעיל את האנימציה; g_center קבוע בשני הקצוות הוא היחיד שנשאר
 * שביר עם זום עולה, ולכן זום-פנימה בודד ממשיך להשתמש בצורת ה-maxzoom
 * הפשוטה כשאין פאן).
 */
export type ZoomMotionId = "zoom-in" | "zoom-out";
export type PanMotionId = "pan-right" | "pan-left" | "pan-down" | "pan-up";
export type VideoMotionId = ZoomMotionId | PanMotionId;

export const VIDEO_MOTION_PRESETS: {
  id: VideoMotionId;
  label: string;
  axis: "zoom" | "pan";
}[] = [
  { id: "zoom-in", label: "זום פנימה", axis: "zoom" },
  { id: "zoom-out", label: "זום החוצה", axis: "zoom" },
  { id: "pan-right", label: "פאן ימינה", axis: "pan" },
  { id: "pan-left", label: "פאן שמאלה", axis: "pan" },
  { id: "pan-down", label: "פאן למטה", axis: "pan" },
  { id: "pan-up", label: "פאן למעלה", axis: "pan" },
];

const ZOOM_IDS: ZoomMotionId[] = ["zoom-in", "zoom-out"];
const PAN_GRAVITY: Record<PanMotionId, { from: string; to: string }> = {
  "pan-right": { from: "g_west", to: "g_east" },
  "pan-left": { from: "g_east", to: "g_west" },
  "pan-down": { from: "g_north", to: "g_south" },
  "pan-up": { from: "g_south", to: "g_north" },
};

function isZoom(id: VideoMotionId): id is ZoomMotionId {
  return (ZOOM_IDS as VideoMotionId[]).includes(id);
}

/**
 * מקבל רשימת פריסטים שנבחרו יחד (למשל ["zoom-in", "pan-right"]) ובונה
 * אפקט zoompan אחד משולב. לכל היותר פריסט זום אחד ופריסט פאן אחד
 * מובאים בחשבון (הראשון מכל סוג ברשימה) — ה-UI כבר אוכף בלעדיות בתוך
 * כל ציר בעצמו.
 */
function buildZoompanEffect(motions: VideoMotionId[], seconds: number): string {
  const zoom = motions.find(isZoom) as ZoomMotionId | undefined;
  const pan = motions.find((m): m is PanMotionId => !isZoom(m));

  if (!pan) {
    if (zoom === "zoom-out") {
      return `e_zoompan:from_(g_center;zoom_1.45);to_(g_center;zoom_1.0);du_${seconds};fps_30`;
    }
    // maxzoom 1.02 (2%) בלתי מורגש; 1.2 (20%) פרוס על 8 שניות התברר עדין
    // מדי לתפיסה מזדמנת; 1.45 (45%) בולט לעין בבירור.
    return `e_zoompan:du_${seconds};maxzoom_1.45;fps_30`;
  }

  const { from: gFrom, to: gTo } = PAN_GRAVITY[pan];
  const [zoomFrom, zoomTo] =
    zoom === "zoom-in" ? ["1.0", "1.45"] : zoom === "zoom-out" ? ["1.45", "1.0"] : ["1.3", "1.3"];
  return `e_zoompan:from_(${gFrom};zoom_${zoomFrom});to_(${gTo};zoom_${zoomTo});du_${seconds};fps_30`;
}

/**
 * מוזיקת רקע חינמית לווידאו החינמי — 4 רצועות אינסטרומנטליות שסונתזו
 * בקוד (additive synthesis, ללא AI בתשלום, ראו scripts/generate-studio-music.mjs)
 * ומועלות ל-Cloudinary תחת public_id קבוע. נבדק בפועל: הרכבת l_audio
 * בלי חיתוך (eo_) מבצעת fl_splice כ"הדבקה" (concatenation) של האודיו
 * *אחרי* סוף הווידאו במקום מיקס במקביל — משך הפלט קופץ ל-video+audio
 * במקום video בלבד. התיקון: eo_<seconds> על שכבת ה-audio לפני
 * fl_layer_apply, שחותך את המוזיקה לאורך הווידאו לפני המיזוג.
 */
export type MusicStyleId = "none" | "luxury" | "cinematic" | "soft" | "upbeat";

export const MUSIC_STYLE_PRESETS: { id: MusicStyleId; label: string }[] = [
  { id: "none", label: "ללא מוזיקה" },
  { id: "luxury", label: "יוקרה עדינה" },
  { id: "cinematic", label: "קולנועי" },
  { id: "soft", label: "רך ואווירתי" },
  { id: "upbeat", label: "מודרני וקליל" },
];

const MUSIC_LAYER_IDS: Record<Exclude<MusicStyleId, "none">, string> = {
  luxury: "yerushalmi-studio:music:luxury",
  cinematic: "yerushalmi-studio:music:cinematic",
  soft: "yerushalmi-studio:music:soft",
  upbeat: "yerushalmi-studio:music:upbeat",
};

function buildMusicOverlay(musicStyle: MusicStyleId, seconds: number): string | null {
  if (musicStyle === "none") return null;
  const layerId = MUSIC_LAYER_IDS[musicStyle];
  return `l_audio:${layerId}/eo_${seconds},e_volume:-20/fl_splice,fl_layer_apply`;
}

/**
 * תנועת Ken Burns חינמית על תמונה בודדת — וידאו mp4 אמיתי, לא GIF.
 * נשאר תחת אותו נכס image/upload (Cloudinary לא מאפשר לגשת אליו דרך
 * video/upload — 404), רק עם fl_animated וסיומת .mp4. שתי מלכודות
 * נוספות: בלי f_ מפורש בשרשרת (למשל f_png) — Cloudinary מכבד פורמט
 * מפורש ומתעלם מסיומת ה-.mp4, ומחזיר תמונה סטטית במקום וידאו; בלי
 * g_auto (גורם ל-423 אסינכרוני על וידאו).
 */
export function zoompanFromImage(
  cloudinaryUrl: string,
  durationSec: number,
  motion: VideoMotionId[] = ["zoom-in"],
  musicStyle: MusicStyleId = "none"
): string {
  const seconds = Math.max(1, Math.round(durationSec));
  // קנבס עבודה גדול (1600) לפני הזום נותן יותר פרטים למדגם ממנו, גם
  // כשה-delivery הסופי מוגבל (בפועל: תקרת רזולוציה של Cloudinary לוידאו
  // מונפש מ-image/upload היא 720x720 — בלי קשר לגודל המבוקש; ביקשנו גם
  // 1080 וגם 2048 וקיבלנו תמיד 720). לכן מבקשים 720 מפורשות אחרי הזום
  // במקום להסתמך על ברירת המחדל (שיצאה 640 — נמוכה מהתקרה בפועל).
  const flatten = "c_limit,w_1600,h_1600,b_white,q_100";
  const zoompan = buildZoompanEffect(motion.length ? motion : ["zoom-in"], seconds);
  const deliverySize = "c_limit,w_720,h_720";
  let transform = `${flatten}/${zoompan}/${deliverySize}/fl_animated/q_auto:best`;
  const musicOverlay = buildMusicOverlay(musicStyle, seconds);
  if (musicOverlay) transform += `/${musicOverlay}`;
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
