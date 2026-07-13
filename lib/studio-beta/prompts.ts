/**
 * טקסטי פרומפט מוכחים לתכשיטים — תוכן, לא קוד. מוקלד מחדש עבור סטודיו
 * בטא מתוך הידע המתועד ב-docs/אפיון-סטודיו-מלא.md.
 */

/** מוצמד לכל פרומפט וידאו AI — מונע עיוות של גיאומטריית התכשיט */
export const JEWELRY_STRUCTURE_LOCK =
  "CRITICAL: keep identical diamond cut, facet geometry, prong layout, center stone shape, chain link count and metal structure from the input image — do not redesign, redraw, or morph any gemstone or setting.";

export const DEFAULT_VIDEO_PROMPT =
  "static luxury jewelry product shot, completely frozen product geometry, locked camera, no camera movement, no background animation, no morphing backdrop, subtle micro sparkle on existing diamond facets only, professional jewelry commercial, soft studio lighting, photorealistic, preserve exact diamond cut and facet pattern, exact prong count and stone shape, exact chain link geometry, seamless smooth gradient backdrop";

export const DEFAULT_VIDEO_NEGATIVE_PROMPT =
  "changing jewelry shape, different ring design, morphing product, deformed diamond, wrong facet geometry, melted prongs, fused stone and metal, changed stone shape, blob diamond, warped chain links, altered link count, extra prongs, missing stones, melted metal, plastic look, camera shake, zoom, orbit, pan, blur, distortion, oversaturated, jitter, low quality, text, watermark, hands, people, split screen, glitch, black bar, spinning background, pulsing background, animated backdrop, background morphing, warping background, speech, dialogue, vocals";

/** פרומפט הרכבה חד-קריאתית (gemini-compose) — ממקם את התכשיט על הרקע בקריאה אחת */
export function buildGeminiComposePrompt(backgroundHint: string): string {
  return `Place this exact jewelry product, completely unchanged, onto a new background. ${backgroundHint} Preserve every diamond, prong, metal edge, chain link, and reflection exactly as in the input photo — do not redraw or redesign the product. Professional e-commerce jewelry photography, photorealistic, high resolution. ${JEWELRY_STRUCTURE_LOCK.replace(
    "CRITICAL: ",
    ""
  )}`;
}

/** פרומפט לבידוד ירוק (Gemini) — נתיב הנפילה הידני בלבד, לעולם לא ברירת מחדל */
export const GEMINI_ISOLATE_PROMPT =
  "Isolate this exact jewelry product on a solid flat chroma-key green background (RGB 0,255,0 only). No checkerboard, no transparency grid, no patterns behind the jewelry. Preserve every diamond, prong, metal edge, chain link, and reflection exactly — do not redraw the product.";

/** בסיס פרומפט לרקע-בלבד (Flux/SDXL) — ללא תכשיט בתמונה */
export function buildBackgroundOnlyPrompt(hint: string): string {
  return `Professional luxury jewelry photography background, empty scene, no jewelry, no ring, no necklace, no bracelet, no earrings, no diamond, no product, no hands, no people, no text, no watermark, no logo: ${hint}`;
}

export const BACKGROUND_ONLY_NEGATIVE_PROMPT =
  "jewelry, ring, necklace, bracelet, earrings, diamond, product, hands, people, text, watermark, logo";

/** תיקון קצוות חתוכים/חסרים בתמונת המקור, בלי לשנות את התכשיט עצמו */
export function buildCompleteEdgesPrompt(): string {
  return `Complete any cropped or missing edges of this exact jewelry product so the full item is visible in frame. Do not redesign or reinterpret any part — only extend what is naturally implied by the existing geometry. ${JEWELRY_STRUCTURE_LOCK}`;
}

/** ניקוי/החלפת רקע לרקע לבן נקי, שמירה מלאה על התכשיט */
export function buildCleanBackgroundPrompt(): string {
  return `Replace the background of this exact jewelry photo with a clean, seamless, evenly lit white background, professional e-commerce style. Preserve every diamond, prong, metal edge, chain link, and reflection exactly as in the input photo. ${JEWELRY_STRUCTURE_LOCK}`;
}

/** חידוד ושיפור בהירות/ניגודיות בסיסי של תמונת המקור, בלי AI גנרטיבי על התכשיט */
export function buildSharpenSourcePrompt(): string {
  return `Enhance the sharpness, clarity and lighting of this exact jewelry photo — crisper facet detail, balanced exposure, professional studio quality. Do not alter the product's shape, stones, or metal in any way. ${JEWELRY_STRUCTURE_LOCK}`;
}

/** זיהוי תמונה — מבקש פסקת תיאור עברית קצרה, לא JSON מובנה */
export function buildJewelryIdentifyPrompt(): string {
  return "תאר בעברית, בפסקה קצרה אחת (2-3 משפטים), את התכשיט שבתמונה: סוג התכשיט (טבעת/שרשרת/עגילים/צמיד/יהלום בודד וכו'), המתכת, האבן/היהלום המרכזי אם יש (סוג חיתוך אם ניתן לזהות), והסגנון הכללי. תיאור עובדתי בלבד המבוסס על מה שנראה בתמונה — בלי להמציא פרטים שלא ניתן לראות.";
}
