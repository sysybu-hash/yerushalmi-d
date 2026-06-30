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

/** חידוד קצוות מתכת בלבד — לא נוגע בפאות יהלום */
async function sharpenMetalEdges(jewelryPng: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();

  const sharpened = await sharp(jewelryPng)
    .sharpen({ sigma: 0.45, m1: 0.35, m2: 0.2, x1: 2, y2: 10, y3: 20 })
    .ensureAlpha()
    .png()
    .toBuffer();

  const edgeWeight = await sharp(jewelryPng)
    .greyscale()
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    })
    .linear(2, -32)
    .blur(1.2)
    .png()
    .toBuffer();

  const jewelryAlpha = await sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .png()
    .toBuffer();

  const maskAlpha = await sharp(edgeWeight)
    .composite([{ input: jewelryAlpha, blend: "multiply" }])
    .png()
    .toBuffer();

  const edgeSharpened = await sharp(sharpened)
    .joinChannel(maskAlpha)
    .png()
    .toBuffer();

  return sharp(jewelryPng)
    .composite([{ input: edgeSharpened, blend: "over" }])
    .png()
    .toBuffer();
}

/** השתקפות מראה מתחת לתכשיט — מראה קטלוגי יוקרתי */
async function createMirrorReflection(
  jewelryPng: Buffer,
  width: number,
  height: number
): Promise<{ buffer: Buffer; overlap: number }> {
  const sharp = await loadSharp();
  const reflectionHeight = Math.max(1, Math.round(height * 0.34));
  const overlap = Math.max(2, Math.round(height * 0.006));

  const flipped = await sharp(jewelryPng)
    .flip()
    .resize(width, reflectionHeight, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .linear(0.5, -6)
    .blur(0.45)
    .png()
    .toBuffer();

  const fadeMask = Buffer.from(
    `<svg width="${width}" height="${reflectionHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0.38"/>
          <stop offset="35%" stop-color="white" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`
  );

  const buffer = await sharp(flipped)
    .composite([{ input: fadeMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return { buffer, overlap };
}

/** צל מגע רך — ללא קו כהה חד */
async function createGroundShadow(
  jewelryPng: Buffer,
  width: number,
  height: number
): Promise<Buffer> {
  const sharp = await loadSharp();
  const shadowWidth = Math.max(1, Math.round(width * 0.68));
  const shadowHeight = Math.max(1, Math.round(height * 0.04));
  const blur = Math.max(2, Math.round(width * 0.012));

  return sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .resize(shadowWidth, shadowHeight, { fit: "fill" })
    .blur(blur)
    .linear(0.08, 0)
    .png()
    .toBuffer();
}

/** הרכבת תכשיט מקורי (PNG שקוף) על רקע — שומר נצנוץ ופיקסלי מקור */
export async function compositeProductImage(
  jewelryPngUrl: string,
  backgroundBuffer: Buffer,
  canvasSize = STUDIO_CANVAS_SIZE,
  options: { forVideo?: boolean } = {}
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

  if (!skipFeather) {
    jewelryPng = await sharpenMetalEdges(jewelryPng);
  }

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

  const { buffer: reflection, overlap } = await createMirrorReflection(
    jewelryPng,
    jWidth,
    jHeight
  );
  const reflectionTop = top + jHeight - overlap;

  const composites: Array<{
    input: Buffer;
    left: number;
    top: number;
    blend?: "over" | "multiply";
  }> = [];

  if (!options.forVideo) {
    const groundShadow = await createGroundShadow(jewelryPng, jWidth, jHeight);
    const shadowLeft = left + Math.round((jWidth - jWidth * 0.68) / 2);
    const shadowTop = top + jHeight - Math.round(jHeight * 0.02);

    composites.push(
      {
        input: reflection,
        left,
        top: reflectionTop,
        blend: "over",
      },
      {
        input: groundShadow,
        left: shadowLeft,
        top: shadowTop,
        blend: "over",
      }
    );
  }

  composites.push({ input: jewelryPng, left, top });

  return sharp(background)
    .composite(composites)
    .png({ compressionLevel: 6 })
    .toBuffer();
}
