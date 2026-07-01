import { loadSharp } from "@/lib/sharp-loader";
import type { SharpOptions } from "sharp";
import { STUDIO_CANVAS_SIZE, type StudioStylePresetId } from "@/lib/studio-presets";

const MIN_OPAQUE_RATIO = 0.008;
const MAX_OPAQUE_RATIO = 0.92;
const MIN_BBOX_RATIO = 0.01;
const JEWELRY_CANVAS_RATIO = 0.78;
const VERTICAL_OFFSET_RATIO = 0.048;
const HORIZONTAL_OFFSET_RATIO = 0.022;

const NO_REFLECTION_PRESETS = new Set<StudioStylePresetId>([
  "white-studio",
  "concrete-minimal",
]);

const PRESET_HARMONIZE: Partial<
  Record<StudioStylePresetId, { brightness?: number; saturation?: number }>
> = {
  "jerusalem-stone": { brightness: 1.03, saturation: 1.05 },
  "midnight-blue": { brightness: 0.98, saturation: 0.95 },
  "rose-gold-glow": { brightness: 1.02, saturation: 1.04 },
  "sunset-amber": { brightness: 1.04, saturation: 1.06 },
  "concrete-minimal": { brightness: 1.02, saturation: 0.92 },
};

const DRAMATIC_SHADOW_PRESETS = new Set<StudioStylePresetId>([
  "luxury-marble",
  "black-velvet",
  "mirror-glass",
  "royal-purple",
  "midnight-blue",
]);

type CutoutMetrics = {
  opaqueRatio: number;
  bboxWidthRatio: number;
  bboxHeightRatio: number;
  edgeDensity: number;
};

async function analyzeCutout(buffer: Buffer): Promise<CutoutMetrics> {
  const sharp = await loadSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const total = info.width * info.height;
  let opaque = 0;
  let minX = info.width;
  let minY = info.height;
  let maxX = 0;
  let maxY = 0;
  let edgePixels = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const alpha = data[i + 3];
      if (alpha > 140) {
        opaque++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else if (alpha > 12 && alpha < 240) {
        edgePixels++;
      }
    }
  }

  const bboxW = maxX >= minX ? maxX - minX + 1 : 0;
  const bboxH = maxY >= minY ? maxY - minY + 1 : 0;

  return {
    opaqueRatio: opaque / total,
    bboxWidthRatio: bboxW / info.width,
    bboxHeightRatio: bboxH / info.height,
    edgeDensity: opaque > 0 ? edgePixels / opaque : 0,
  };
}

/** וידוא ש-cutout בידד תכשיט אמיתי ולא החזיר תמונה ריקה/מלאה */
export async function validateJewelryCutout(buffer: Buffer): Promise<void> {
  const metrics = await analyzeCutout(buffer);

  if (metrics.opaqueRatio < MIN_OPAQUE_RATIO) {
    throw new Error(
      "לא הצלחנו לבודד את התכשיט מהרקע. נסו צילום עם רקע אחיד (לבן/אפור) והתכשיט במרכז."
    );
  }

  if (metrics.opaqueRatio > MAX_OPAQUE_RATIO) {
    throw new Error(
      "נראה שהרקע לא הוסר כראוי — ודאו שהתכשיט בולט על רקע אחיד ולא תופס את כל המסך."
    );
  }

  if (
    metrics.bboxWidthRatio < MIN_BBOX_RATIO ||
    metrics.bboxHeightRatio < MIN_BBOX_RATIO
  ) {
    throw new Error(
      "התכשיט קטן מדי בתמונה — התקרבו או חתכו כך שהתכשיט יתפוס לפחות 15% מהפריים."
    );
  }

  if (metrics.edgeDensity > 0.35) {
    throw new Error(
      "קצוות ה-cutout נראים שבורים — נסו רקע אחיד יותר או תאורה רכה ללא צללים חדים."
    );
  }
}

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

async function createContactShadow(
  jewelryPng: Buffer,
  left: number,
  top: number,
  jWidth: number,
  jHeight: number,
  canvasSize: number,
  preset: StudioStylePresetId
): Promise<Buffer> {
  const sharp = await loadSharp();
  const dramatic = DRAMATIC_SHADOW_PRESETS.has(preset);
  const shadowW = Math.round(jWidth * 0.72);
  const shadowH = Math.max(8, Math.round(jHeight * 0.08));
  const shadowLeft = Math.round(left + (jWidth - shadowW) / 2);
  const shadowTop = Math.min(
    canvasSize - shadowH - 2,
    top + jHeight - Math.round(jHeight * 0.06)
  );
  const opacity = dramatic ? 0.42 : 0.28;

  const ellipse = Buffer.from(
    `<svg width="${shadowW}" height="${shadowH}">
      <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW / 2}" ry="${shadowH / 2}" fill="black"/>
    </svg>`
  );

  const shadow = await sharp(ellipse)
    .blur(Math.max(4, Math.round(shadowH * 0.45)))
    .ensureAlpha()
    .png()
    .toBuffer();

  const faded = await sharp(shadow)
    .composite([
      {
        input: Buffer.from([0, 0, 0, Math.round(255 * opacity)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const canvas = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  } as SharpOptions)
    .composite([{ input: faded, left: shadowLeft, top: shadowTop }])
    .png()
    .toBuffer();

  return canvas;
}

async function createFloorReflection(
  jewelryPng: Buffer,
  left: number,
  top: number,
  jWidth: number,
  jHeight: number,
  canvasSize: number,
  opacity: number
): Promise<Buffer> {
  const sharp = await loadSharp();
  const reflectH = Math.min(Math.round(jHeight * 0.35), canvasSize - top - jHeight);

  const flipped = await sharp(jewelryPng)
    .flip()
    .resize(jWidth, reflectH, { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const gradient = Buffer.from(
    `<svg width="${jWidth}" height="${reflectH}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="${opacity}"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
  );

  const masked = await sharp(flipped)
    .composite([{ input: gradient, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  } as SharpOptions)
    .composite([
      {
        input: masked,
        left,
        top: top + jHeight - Math.round(reflectH * 0.15),
      },
    ])
    .png()
    .toBuffer();
}

async function harmonizeJewelry(
  jewelryPng: Buffer,
  preset: StudioStylePresetId
): Promise<Buffer> {
  const tune = PRESET_HARMONIZE[preset];
  if (!tune) return jewelryPng;

  const sharp = await loadSharp();
  let pipeline = sharp(jewelryPng).ensureAlpha();
  if (tune.brightness != null) {
    pipeline = pipeline.modulate({ brightness: tune.brightness });
  }
  if (tune.saturation != null) {
    pipeline = pipeline.modulate({ saturation: tune.saturation });
  }
  return pipeline.png().toBuffer();
}

/** הרכבת תכשיט מקורי על רקע עם צל מגע והשתקפות עדינה */
export async function compositeProductImage(
  jewelryPngUrl: string,
  backgroundBuffer: Buffer,
  canvasSize = STUDIO_CANVAS_SIZE,
  stylePreset: StudioStylePresetId = "luxury-marble"
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
  jewelryPng = await harmonizeJewelry(jewelryPng, stylePreset);

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

  const shadowLayer = await createContactShadow(
    jewelryPng,
    left,
    top,
    jWidth,
    jHeight,
    canvasSize,
    stylePreset
  );

  const composites: { input: Buffer; left?: number; top?: number; blend?: "over" | "multiply" | "dest-over" }[] = [
    { input: shadowLayer, blend: "multiply" },
  ];

  if (!NO_REFLECTION_PRESETS.has(stylePreset)) {
    const reflection = await createFloorReflection(
      jewelryPng,
      left,
      top,
      jWidth,
      jHeight,
      canvasSize,
      0.1
    );
    composites.push({ input: reflection, blend: "over" });
  }

  composites.push({ input: jewelryPng, left, top });

  return sharp(background)
    .composite(composites)
    .png({ compressionLevel: 6 })
    .toBuffer();
}
