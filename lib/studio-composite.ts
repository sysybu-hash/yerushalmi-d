import { loadSharp } from "@/lib/sharp-loader";
import { STUDIO_CANVAS_SIZE } from "@/lib/studio-presets";

const MIN_OPAQUE_RATIO = 0.008;
const JEWELRY_CANVAS_RATIO = 0.72;

/** וידוא ש-rembg בידד תכשיט אמיתי ולא החזיר תמונה ריקה/מלאה */
export async function validateJewelryCutout(buffer: Buffer): Promise<void> {
  const sharp = await loadSharp();
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
}

/** החלקת קצוות אלפא — מפחית שיניים מ-rembg בלי לטשטש פרטי יהלום */
async function refineCutoutEdges(jewelryPng: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  const rgb = await sharp(jewelryPng).removeAlpha().png().toBuffer();
  const alpha = await sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .blur(0.65)
    .png()
    .toBuffer();

  return sharp(rgb).joinChannel(alpha).png().toBuffer();
}

/** צל מגע עדין — לא הילה מסביב לתכשיט */
async function createContactShadow(
  jewelryPng: Buffer,
  width: number,
  height: number
): Promise<{ buffer: Buffer; offsetY: number }> {
  const sharp = await loadSharp();
  const shadowWidth = Math.max(1, Math.round(width * 0.82));
  const shadowHeight = Math.max(1, Math.round(height * 0.1));
  const blur = Math.max(2, Math.round(width * 0.009));

  const buffer = await sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .resize(shadowWidth, shadowHeight, { fit: "fill" })
    .blur(blur)
    .linear(0.22, 0)
    .png()
    .toBuffer();

  return {
    buffer,
    offsetY: Math.round(height * 0.025),
  };
}

/** הרכבת תכשיט מקורי (PNG שקוף) על רקע — פיקסלים של התכשיט לא נוגעים ב-AI */
export async function compositeProductImage(
  jewelryPngUrl: string,
  backgroundBuffer: Buffer,
  canvasSize = STUDIO_CANVAS_SIZE
): Promise<Buffer> {
  const sharp = await loadSharp();

  const jewelryRes = await fetch(jewelryPngUrl);
  if (!jewelryRes.ok) {
    throw new Error("לא ניתן להוריד את תמונת התכשיט");
  }

  const jewelryInput = Buffer.from(await jewelryRes.arrayBuffer());
  await validateJewelryCutout(jewelryInput);

  const jewelryMaxWidth = Math.round(canvasSize * JEWELRY_CANVAS_RATIO);

  const jewelryPng = await refineCutoutEdges(
    await sharp(jewelryInput)
      .trim({ threshold: 10 })
      .resize({
        width: jewelryMaxWidth,
        height: jewelryMaxWidth,
        fit: "inside",
        kernel: "lanczos3",
        withoutEnlargement: false,
      })
      .sharpen({ sigma: 0.45, m1: 0.35, m2: 0.25, x1: 2, y2: 10, y3: 20 })
      .png({ compressionLevel: 6 })
      .toBuffer()
  );

  const background = await sharp(backgroundBuffer)
    .resize(canvasSize, canvasSize, { fit: "cover", position: "centre", kernel: "lanczos3" })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const jMeta = await sharp(jewelryPng).metadata();
  const jWidth = jMeta.width ?? jewelryMaxWidth;
  const jHeight = jMeta.height ?? jewelryMaxWidth;
  const left = Math.max(0, Math.round((canvasSize - jWidth) / 2));
  const top = Math.max(0, Math.round((canvasSize - jHeight) / 2 - canvasSize * 0.015));

  const { buffer: shadow, offsetY } = await createContactShadow(
    jewelryPng,
    jWidth,
    jHeight
  );
  const shadowLeft = left + Math.round((jWidth - (jWidth * 0.82)) / 2);
  const shadowTop = top + jHeight - Math.round(jHeight * 0.06) + offsetY;

  return sharp(background)
    .composite([
      { input: shadow, left: shadowLeft, top: shadowTop, blend: "multiply" },
      { input: jewelryPng, left, top },
    ])
    .sharpen({ sigma: 0.28, m1: 0.2, m2: 0.15, x1: 2, y2: 8, y3: 16 })
    .png({ compressionLevel: 6 })
    .toBuffer();
}
