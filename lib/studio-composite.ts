import { loadSharp } from "@/lib/sharp-loader";
import { STUDIO_CANVAS_SIZE } from "@/lib/studio-presets";

const MIN_OPAQUE_RATIO = 0.008;
const JEWELRY_CANVAS_RATIO = 0.78;
/** מיקום קטלוגי — מעט מעל המרכז, זווית 3/4 עדינה */
const VERTICAL_OFFSET_RATIO = 0.048;
const HORIZONTAL_OFFSET_RATIO = 0.022;

/** וידוא ש-cutout בידד תכשיט אמיתי ולא החזיר תמונה ריקה/מלאה */
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

/** Bria RMBG 2.0 מחזיר matte רך — דילוג על feather שמטשטש יהלומים */
async function hasSoftAlphaMatte(buffer: Buffer): Promise<boolean> {
  const sharp = await loadSharp();
  const { data } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let partial = 0;
  let opaque = 0;

  for (let i = 3; i < data.length; i += 4) {
    const alpha = data[i];
    if (alpha > 180) opaque++;
    else if (alpha > 12 && alpha < 240) partial++;
  }

  return opaque > 0 && partial / opaque > 0.012;
}

/** החלקת קצוות אלפא בלבד — רק למודלים עם מסכה בינארית */
async function refineCutoutEdges(
  jewelryPng: Buffer,
  skipFeather: boolean
): Promise<Buffer> {
  if (skipFeather) return jewelryPng;

  const sharp = await loadSharp();
  const rgb = await sharp(jewelryPng).removeAlpha().png().toBuffer();
  const alpha = await sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .blur(0.3)
    .png()
    .toBuffer();

  return sharp(rgb).joinChannel(alpha).png().toBuffer();
}

/** הרכבת תכשיט מקורי (PNG שקוף) על רקע — ללא השתקפות/צל (מונע קו אופקי) */
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

  const skipFeather = await hasSoftAlphaMatte(jewelryInput);
  const jewelryMaxWidth = Math.round(canvasSize * JEWELRY_CANVAS_RATIO);

  let jewelryPng = await sharp(jewelryInput)
    .trim({ threshold: 8 })
    .resize({
      width: jewelryMaxWidth,
      height: jewelryMaxWidth,
      fit: "inside",
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 6 })
    .toBuffer();

  jewelryPng = await refineCutoutEdges(jewelryPng, skipFeather);

  const background = await sharp(backgroundBuffer)
    .resize(canvasSize, canvasSize, {
      fit: "cover",
      position: "centre",
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 6 })
    .toBuffer();

  const jMeta = await sharp(jewelryPng).metadata();
  const jWidth = jMeta.width ?? jewelryMaxWidth;
  const jHeight = jMeta.height ?? jewelryMaxWidth;
  const left = Math.max(
    0,
    Math.round((canvasSize - jWidth) / 2 + canvasSize * HORIZONTAL_OFFSET_RATIO)
  );
  const top = Math.max(
    0,
    Math.round((canvasSize - jHeight) / 2 - canvasSize * VERTICAL_OFFSET_RATIO)
  );

  return sharp(background)
    .composite([{ input: jewelryPng, left, top }])
    .png({ compressionLevel: 6 })
    .toBuffer();
}
