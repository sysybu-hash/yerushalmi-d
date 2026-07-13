import sharp from "sharp";
import { renderProceduralBackground } from "@/lib/studio-beta/procedural-backgrounds";
import { getLibraryBackgroundUrl } from "@/lib/studio-beta/background-library";

/**
 * הרכבה דקה בכוונה: מיקום/resize של תמונת המוצר על קנבס הרקע + צל מגע
 * רך אחד (אליפסה מטושטשת). בלי ניתוח שקיפות רב-שלבי, בלי feathering,
 * בלי הרמוניזציה לפי סגנון — הצינור הישן שסבל מזה היה מקור עיקרי לבאגים.
 */

export async function compositeOnBackground(
  productPng: Buffer,
  backgroundPng: Buffer
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundPng).metadata();
  const canvasWidth = bgMeta.width ?? 2048;
  const canvasHeight = bgMeta.height ?? 2048;

  const targetWidth = Math.round(canvasWidth * 0.7);
  const targetHeight = Math.round(canvasHeight * 0.7);

  const productBuffer = await sharp(productPng)
    .resize(targetWidth, targetHeight, { fit: "inside" })
    .toBuffer();
  const productMeta = await sharp(productBuffer).metadata();
  const productWidth = productMeta.width ?? targetWidth;
  const productHeight = productMeta.height ?? targetHeight;

  const left = Math.round((canvasWidth - productWidth) / 2);
  const top = Math.round(canvasHeight * 0.58 - productHeight / 2);

  const shadowWidth = Math.max(1, Math.round(productWidth * 0.75));
  const shadowHeight = Math.max(1, Math.round(productHeight * 0.1));
  const blur = Math.max(1, Math.round(shadowHeight * 0.35));
  const shadowSvg = Buffer.from(
    `<svg width="${shadowWidth}" height="${shadowHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="b"><feGaussianBlur stdDeviation="${blur}" /></filter></defs>
      <ellipse cx="${shadowWidth / 2}" cy="${shadowHeight / 2}" rx="${
      shadowWidth / 2
    }" ry="${shadowHeight / 2}" fill="black" opacity="0.25" filter="url(#b)" />
    </svg>`
  );
  const shadowBuffer = await sharp(shadowSvg).png().toBuffer();
  const shadowLeft = Math.round((canvasWidth - shadowWidth) / 2);
  const shadowTop = Math.round(top + productHeight - shadowHeight * 0.4);

  return sharp(backgroundPng)
    .resize(canvasWidth, canvasHeight)
    .composite([
      { input: shadowBuffer, left: shadowLeft, top: shadowTop },
      { input: productBuffer, left, top },
    ])
    .png()
    .toBuffer();
}

/**
 * רקע פרוצדורלי חינמי: קודם כל מנסה תמונת רקע אמיתית מוכנה מהספרייה
 * (נוצרה פעם אחת ב-Gemini, לא SVG) — אפס עלות AI בזמן ריצה. אם הפריסט
 * לא בספרייה (או שההורדה נכשלה), נופל למחולל ה-SVG הניתן-להרכבה
 * כרשת ביטחון שתמיד מחזירה רקע, גם בלי גישה לרשת.
 */
export async function generateProceduralBackground(
  presetId?: string | null,
  size = 2048
): Promise<Buffer> {
  const libraryUrl = getLibraryBackgroundUrl(presetId);
  if (libraryUrl) {
    try {
      const response = await fetch(libraryUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        return sharp(buffer).resize(size, size, { fit: "cover" }).png().toBuffer();
      }
    } catch {
      // נופלים ל-SVG למטה
    }
  }
  return renderProceduralBackground(presetId, size);
}
