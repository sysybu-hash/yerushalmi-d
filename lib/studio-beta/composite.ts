import sharp from "sharp";
import { renderProceduralBackground } from "@/lib/studio-beta/procedural-backgrounds";
import { getLibraryBackgroundUrl } from "@/lib/studio-beta/background-library";

/**
 * הרכבה דקה בכוונה: מיקום/resize של תמונת המוצר על קנבס הרקע + צל מגע
 * רך אחד (אליפסה מטושטשת). בלי ניתוח שקיפות רב-שלבי, בלי feathering,
 * בלי הרמוניזציה לפי סגנון — הצינור הישן שסבל מזה היה מקור עיקרי לבאגים.
 */

export type CompositePlacement = { scale: number; offsetX: number; offsetY: number };
/** זום/פאן על שכבת הרקע עצמה — offsetX/offsetY הם 0..1 כמו background-position ב-CSS */
export type BackdropPlacement = { scale: number; offsetX: number; offsetY: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** מכין את שכבת הרקע: זום ו-crop לפי backdropPlacement, תמיד בגודל הקנבס הסופי בדיוק */
async function prepareBackdrop(
  backgroundPng: Buffer,
  canvasWidth: number,
  canvasHeight: number,
  backdropPlacement?: BackdropPlacement
): Promise<Buffer> {
  const bgScale = clamp(backdropPlacement?.scale ?? 1, 1, 2);
  if (bgScale <= 1) {
    return sharp(backgroundPng).resize(canvasWidth, canvasHeight, { fit: "cover" }).toBuffer();
  }

  const bgOffsetX = clamp(backdropPlacement?.offsetX ?? 0.5, 0, 1);
  const bgOffsetY = clamp(backdropPlacement?.offsetY ?? 0.5, 0, 1);
  const scaledWidth = Math.round(canvasWidth * bgScale);
  const scaledHeight = Math.round(canvasHeight * bgScale);
  const left = Math.round(bgOffsetX * (scaledWidth - canvasWidth));
  const top = Math.round(bgOffsetY * (scaledHeight - canvasHeight));

  return sharp(backgroundPng)
    .resize(scaledWidth, scaledHeight, { fit: "cover" })
    .extract({
      left: clamp(left, 0, scaledWidth - canvasWidth),
      top: clamp(top, 0, scaledHeight - canvasHeight),
      width: canvasWidth,
      height: canvasHeight,
    })
    .toBuffer();
}

export async function compositeOnBackground(
  productPng: Buffer,
  backgroundPng: Buffer,
  placement?: CompositePlacement,
  backdropPlacement?: BackdropPlacement
): Promise<Buffer> {
  const bgMeta = await sharp(backgroundPng).metadata();
  const canvasWidth = bgMeta.width ?? 2048;
  const canvasHeight = bgMeta.height ?? 2048;

  const preparedBackground = await prepareBackdrop(
    backgroundPng,
    canvasWidth,
    canvasHeight,
    backdropPlacement
  );

  const scale = clamp(placement?.scale ?? 1, 0.6, 1.3);
  const offsetX = clamp(placement?.offsetX ?? 0, -0.25, 0.25);
  const offsetY = clamp(placement?.offsetY ?? 0, -0.25, 0.25);

  const targetWidth = Math.round(canvasWidth * 0.7 * scale);
  const targetHeight = Math.round(canvasHeight * 0.7 * scale);

  const productBuffer = await sharp(productPng)
    .resize(targetWidth, targetHeight, { fit: "inside" })
    .toBuffer();
  const productMeta = await sharp(productBuffer).metadata();
  const productWidth = productMeta.width ?? targetWidth;
  const productHeight = productMeta.height ?? targetHeight;

  const left = Math.round(
    (canvasWidth - productWidth) / 2 + offsetX * canvasWidth
  );
  const top = Math.round(
    canvasHeight * 0.58 - productHeight / 2 + offsetY * canvasHeight
  );

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

  return sharp(preparedBackground)
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
