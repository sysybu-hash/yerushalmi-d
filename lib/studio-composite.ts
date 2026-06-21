import sharp from "sharp";

import { STUDIO_CANVAS_SIZE } from "@/lib/studio-presets";

const MIN_OPAQUE_RATIO = 0.015;
const MAX_OPAQUE_RATIO = 0.72;
const JEWELRY_CANVAS_RATIO = 0.75;

/** וידוא ש-rembg בידד תכשיט אמיתי ולא החזיר תמונה ריקה/מלאה */
export async function validateJewelryCutout(buffer: Buffer): Promise<void> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const total = info.width * info.height;
  let opaque = 0;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 140) opaque++;
  }

  const ratio = opaque / total;

  if (ratio < MIN_OPAQUE_RATIO) {
    throw new Error(
      "לא הצלחנו לבודד את התכשיט מהרקע. נסו צילום עם רקע אחיד (לבן/אפור) והתכשיט במרכז."
    );
  }

  if (ratio > MAX_OPAQUE_RATIO) {
    throw new Error(
      "הרקע לא הוסר כראוי. נסו צילום עם ניגודיות גבוהה יותר בין התכשיט לרקע."
    );
  }
}

async function createDropShadow(
  jewelryPng: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const blur = Math.max(4, Math.round(width * 0.022));

  return sharp(jewelryPng)
    .ensureAlpha()
    .blur(blur)
    .modulate({ brightness: 0, saturation: 0 })
    .linear(0.32, 0)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();
}

/** הרכבת תכשיט מקורי (PNG שקוף) על רקע — פיקסלים של התכשיט לא נוגעים ב-AI */
export async function compositeProductImage(
  jewelryPngUrl: string,
  backgroundBuffer: Buffer,
  canvasSize = STUDIO_CANVAS_SIZE
): Promise<Buffer> {
  const jewelryRes = await fetch(jewelryPngUrl);
  if (!jewelryRes.ok) {
    throw new Error("לא ניתן להוריד את תמונת התכשיט");
  }

  const jewelryInput = Buffer.from(await jewelryRes.arrayBuffer());
  await validateJewelryCutout(jewelryInput);

  const jewelryMaxWidth = Math.round(canvasSize * JEWELRY_CANVAS_RATIO);

  const jewelryPng = await sharp(jewelryInput)
    .trim({ threshold: 8 })
    .resize({
      width: jewelryMaxWidth,
      height: jewelryMaxWidth,
      fit: "inside",
      withoutEnlargement: false,
    })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.35 })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const background = await sharp(backgroundBuffer)
    .resize(canvasSize, canvasSize, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const jMeta = await sharp(jewelryPng).metadata();
  const jWidth = jMeta.width ?? jewelryMaxWidth;
  const jHeight = jMeta.height ?? jewelryMaxWidth;
  const left = Math.max(0, Math.round((canvasSize - jWidth) / 2));
  const top = Math.max(0, Math.round((canvasSize - jHeight) / 2 - canvasSize * 0.02));

  const shadow = await createDropShadow(jewelryPng, jWidth, jHeight);
  const shadowLeft = left;
  const shadowTop = top + Math.round(jHeight * 0.04);

  return sharp(background)
    .composite([
      { input: shadow, left: shadowLeft, top: shadowTop, blend: "multiply" },
      { input: jewelryPng, left, top },
    ])
    .png({ compressionLevel: 6 })
    .toBuffer();
}
