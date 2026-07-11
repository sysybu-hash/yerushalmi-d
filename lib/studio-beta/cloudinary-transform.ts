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
 * תנועת Ken Burns חינמית על תמונה בודדת — Cloudinary לא מאפשר לגשת
 * לנכס image/upload דרך video/upload (404), אז הפלט האמיתי כאן הוא GIF
 * מונפש בתוך משאב ה-image (fl_animated), לא mp4. הצרכן צריך להציג אותו
 * ב-<img>, לא ב-<video>.
 */
export function zoompanFromImage(
  cloudinaryUrl: string,
  durationSec: number
): string {
  const seconds = Math.max(1, Math.round(durationSec));
  const transform = `e_zoompan:du_${seconds};maxzoom_1.02,g_center,w_900,q_auto,fl_animated`;
  const withTransform = insertTransform(cloudinaryUrl, transform);
  return withTransform.replace(/\.[a-zA-Z0-9]+$/, ".gif");
}

/** שיפור חינמי לוידאו שהועלה — ללא f_png, g_center תמיד */
export function enhanceUploadedVideo(cloudinaryUrl: string): string {
  return insertTransform(
    cloudinaryUrl,
    "e_improve,e_denoise:40,e_sharpen:50,g_center"
  );
}
