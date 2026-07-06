import { loadSharp } from "@/lib/sharp-loader";
import type { SharpOptions } from "sharp";
import { STUDIO_CANVAS_SIZE, type StudioStylePresetId } from "@/lib/studio-presets";

const MIN_OPAQUE_RATIO = 0.008;
const MAX_OPAQUE_RATIO = 0.92;
const MIN_BBOX_RATIO = 0.01;
const JEWELRY_CANVAS_RATIO = 0.72;
const HORIZONTAL_OFFSET_RATIO = 0.012;

/** קו משטח תצוגה — איפה תחתית התכשיט "נשענת" (יחס לגובה קנבס) */
const PRESET_SURFACE_Y: Partial<Record<StudioStylePresetId, number>> = {
  "luxury-marble": 0.64,
  "black-velvet": 0.6,
  "white-studio": 0.56,
  "gold-bokeh": 0.62,
  lifestyle: 0.66,
  "rose-gold-glow": 0.6,
  "midnight-blue": 0.61,
  "jerusalem-stone": 0.63,
  "concrete-minimal": 0.57,
  "botanical-soft": 0.58,
  "mirror-glass": 0.59,
  "royal-purple": 0.6,
  "sunset-amber": 0.61,
};

const NO_REFLECTION_PRESETS = new Set<StudioStylePresetId>([
  "white-studio",
  "concrete-minimal",
  "black-velvet",
  "midnight-blue",
  "royal-purple",
  "gold-bokeh",
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

  if (
    metrics.bboxWidthRatio < MIN_BBOX_RATIO ||
    metrics.bboxHeightRatio < MIN_BBOX_RATIO
  ) {
    throw new Error(
      "התכשיט קטן מדי בתמונה — התקרבו או חתכו כך שהתכשיט יתפוס יותר שטח בפריים."
    );
  }
}

/** הסרת רקע לבן/אפור אחיד — fallback כש-Bria משאיר רקע אטום */
async function stripLightBackground(
  buffer: Buffer,
  tolerance = 34
): Promise<Buffer> {
  const sharp = await loadSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const spread = max - min;

    if (min >= 255 - tolerance && spread <= Math.max(6, tolerance / 2)) {
      out[i + 3] = 0;
      continue;
    }

    if (min >= 210 - tolerance && spread <= tolerance) {
      const lift = (min - (210 - tolerance)) / (45 + tolerance);
      out[i + 3] = Math.min(out[i + 3], Math.round(255 * Math.min(1, lift * 1.4)));
    }
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** הסרת רקע משבצות ש-Gemini מצייר במקום אלפא אמיתית */
async function stripCheckerboardBackground(buffer: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  let removed = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (spread > 28) continue;

      const lum = (r + g + b) / 3;
      if (lum < 150) continue;

      let matches = false;
      for (const tile of [8, 16, 32]) {
        const checker = (Math.floor(x / tile) + Math.floor(y / tile)) % 2;
        if (checker === 0 && lum > 235) matches = true;
        if (checker === 1 && lum > 175 && lum < 220) matches = true;
      }

      if (matches) {
        out[i + 3] = 0;
        removed++;
      }
    }
  }

  if (removed < w * h * 0.04) return buffer;

  return sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** הסרת רקע כרומה ירוק (Gemini) */
async function chromaKeyGreenBackground(buffer: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);
  let keyed = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];

      const isGreen =
        g > 160 && g > r + 35 && g > b + 35 && g - Math.max(r, b) > 40;
      const isNearGreen =
        g > 120 && g > r + 20 && g > b + 20 && g - Math.max(r, b) > 25;

      if (isGreen) {
        out[i + 3] = 0;
        keyed++;
      } else if (isNearGreen) {
        out[i + 3] = Math.min(out[i + 3], 80);
        keyed++;
      }
    }
  }

  if (keyed < w * h * 0.02) return buffer;

  return sharp(out, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** מכין PNG עם אלפא תקין — AI ואז fallback פרוצדורלי לרקע אחיד */
export async function normalizeJewelryCutout(buffer: Buffer): Promise<Buffer> {
  let current = await stripCheckerboardBackground(buffer);
  current = await chromaKeyGreenBackground(current);
  let metrics = await analyzeCutout(current);

  if (metrics.opaqueRatio > MAX_OPAQUE_RATIO) {
    current = await stripLightBackground(current, 34);
    metrics = await analyzeCutout(current);
  }

  if (metrics.opaqueRatio > MAX_OPAQUE_RATIO) {
    current = await stripLightBackground(current, 52);
    metrics = await analyzeCutout(current);
  }

  await validateJewelryCutout(current);
  return current;
}

function clampCompositePosition(
  canvasSize: number,
  overlayW: number,
  overlayH: number,
  left: number,
  top: number
) {
  const maxLeft = Math.max(0, canvasSize - overlayW);
  const maxTop = Math.max(0, canvasSize - overlayH);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

async function readImageSize(buffer: Buffer) {
  const sharp = await loadSharp();
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
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

function computeJewelryPlacement(
  canvasSize: number,
  jWidth: number,
  jHeight: number,
  preset: StudioStylePresetId
) {
  const surfaceY = PRESET_SURFACE_Y[preset] ?? 0.6;
  const surfacePx = Math.round(canvasSize * surfaceY);
  const top = surfacePx - jHeight;
  const left = Math.round(
    (canvasSize - jWidth) / 2 + canvasSize * HORIZONTAL_OFFSET_RATIO
  );
  return clampCompositePosition(canvasSize, jWidth, jHeight, left, top);
}

/** מרכך חיתוך חד בראש שרשרת — fade באלפא */
async function softenTopChainFade(
  jewelryPng: Buffer,
  jWidth: number,
  jHeight: number
): Promise<Buffer> {
  if (jHeight <= jWidth * 1.12) return jewelryPng;

  const sharp = await loadSharp();
  const fadeH = Math.max(12, Math.round(jHeight * 0.14));
  const gradient = Buffer.from(
    `<svg width="${jWidth}" height="${jHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0"/>
          <stop offset="${Math.round((fadeH / jHeight) * 100)}%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`
  );

  return sharp(jewelryPng)
    .ensureAlpha()
    .composite([{ input: gradient, blend: "dest-in" }])
    .png()
    .toBuffer();
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
    .blur(0.15)
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
    top + jHeight - Math.round(jHeight * 0.01)
  );
  const opacity = dramatic ? 0.52 : 0.36;

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

  const fadedSize = await readImageSize(faded);
  const shadowPos = clampCompositePosition(
    canvasSize,
    fadedSize.width,
    fadedSize.height,
    shadowLeft,
    shadowTop
  );

  const canvas = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  } as SharpOptions)
    .composite([
      {
        input: faded,
        left: shadowPos.left,
        top: shadowPos.top,
      },
    ])
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
  const reflectH = Math.max(
    0,
    Math.min(Math.round(jHeight * 0.35), canvasSize - top - jHeight)
  );

  if (reflectH < 8) {
    return sharp({
      create: {
        width: canvasSize,
        height: canvasSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    } as SharpOptions)
      .png()
      .toBuffer();
  }

  const flipped = await sharp(jewelryPng)
    .flip()
    .resize(jWidth, reflectH, { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const flippedSize = await readImageSize(flipped);

  const gradient = Buffer.from(
    `<svg width="${flippedSize.width}" height="${flippedSize.height}">
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

  const maskedSize = await readImageSize(masked);
  const reflectPos = clampCompositePosition(
    canvasSize,
    maskedSize.width,
    maskedSize.height,
    left,
    top + jHeight - Math.round(reflectH * 0.15)
  );

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
        left: reflectPos.left,
        top: reflectPos.top,
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
  const sharp = await loadSharp();
  let pipeline = sharp(jewelryPng).ensureAlpha();
  if (tune?.brightness != null) {
    pipeline = pipeline.modulate({ brightness: tune.brightness });
  }
  if (tune?.saturation != null) {
    pipeline = pipeline.modulate({ saturation: tune.saturation });
  }
  return pipeline.png().toBuffer();
}

/** חידוד עדין לתכשיט — RGB בלבד, שומר על אלפא */
async function sharpenJewelryLayer(jewelryPng: Buffer): Promise<Buffer> {
  const sharp = await loadSharp();
  const rgb = await sharp(jewelryPng)
    .removeAlpha()
    .sharpen({ sigma: 0.85, m1: 1.15, m2: 0.45, x1: 2, y2: 10, y3: 20 })
    .png()
    .toBuffer();
  const alpha = await sharp(jewelryPng)
    .ensureAlpha()
    .extractChannel(3)
    .png()
    .toBuffer();
  return sharp(rgb).joinChannel(alpha).png({ compressionLevel: 2 }).toBuffer();
}

/** הרכבת תכשיט מקורי על רקע עם צל מגע והשתקפות עדינה */
export async function compositeProductImage(
  jewelryPngUrl: string,
  backgroundBuffer: Buffer,
  canvasSize = STUDIO_CANVAS_SIZE,
  stylePreset: StudioStylePresetId = "luxury-marble",
  options: { forVideo?: boolean } = {}
): Promise<Buffer> {
  const sharp = await loadSharp();

  const jewelryRes = await fetch(jewelryPngUrl);
  if (!jewelryRes.ok) {
    throw new Error("לא ניתן להוריד את תמונת התכשיט");
  }

  const jewelryInput = await normalizeJewelryCutout(
    Buffer.from(await jewelryRes.arrayBuffer())
  );

  const skipFeather = await hasSoftAlphaMatte(jewelryInput);
  const jewelryMaxWidth = Math.round(canvasSize * JEWELRY_CANVAS_RATIO);
  const inputMeta = await sharp(jewelryInput).metadata();
  const nativeWidth = inputMeta.width ?? jewelryMaxWidth;
  const targetWidth = options.forVideo
    ? Math.min(
        jewelryMaxWidth,
        Math.max(nativeWidth, Math.round(nativeWidth * 1.15))
      )
    : jewelryMaxWidth;

  let jewelryPng = await sharp(jewelryInput)
    .trim({ threshold: 6 })
    .resize({
      width: targetWidth,
      height: targetWidth,
      fit: "inside",
      kernel: "lanczos3",
      withoutEnlargement: false,
    })
    .png({ compressionLevel: 2 })
    .toBuffer();

  jewelryPng = await refineCutoutEdges(jewelryPng, skipFeather);
  jewelryPng = await harmonizeJewelry(jewelryPng, stylePreset);
  jewelryPng = await sharpenJewelryLayer(jewelryPng);

  const jMeta = await sharp(jewelryPng).metadata();
  const jWidth = jMeta.width ?? jewelryMaxWidth;
  const jHeight = jMeta.height ?? jewelryMaxWidth;
  jewelryPng = await softenTopChainFade(jewelryPng, jWidth, jHeight);

  const background = await sharp(backgroundBuffer)
    .resize(canvasSize, canvasSize, {
      fit: "cover",
      position: "centre",
      kernel: "lanczos3",
    })
    .sharpen({ sigma: 0.25, m1: 0.45, m2: 0.12 })
    .png({ compressionLevel: 2 })
    .toBuffer();

  const jewelryPos = computeJewelryPlacement(
    canvasSize,
    jWidth,
    jHeight,
    stylePreset
  );
  const left = jewelryPos.left;
  const top = jewelryPos.top;

  const composites: {
    input: Buffer;
    left?: number;
    top?: number;
    blend?: "over" | "multiply" | "dest-over";
  }[] = [];

  if (!options.forVideo) {
    const shadowLayer = await createContactShadow(
      jewelryPng,
      left,
      top,
      jWidth,
      jHeight,
      canvasSize,
      stylePreset
    );
    composites.push({ input: shadowLayer, blend: "multiply" });

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
  }

  composites.push({ input: jewelryPng, left, top });

  const bgColor = await sampleBackgroundColor(backgroundBuffer);

  const composed = sharp(background)
    .composite(composites)
    .sharpen({ sigma: 0.4, m1: 0.55, m2: 0.18, x1: 2, y2: 10, y3: 20 })
    .flatten({ background: bgColor })
    .jpeg({ quality: 96, mozjpeg: true });

  return composed.toBuffer();
}

async function sampleBackgroundColor(
  backgroundBuffer: Buffer
): Promise<{ r: number; g: number; b: number }> {
  const sharp = await loadSharp();
  const stats = await sharp(backgroundBuffer).resize(64, 64, { fit: "cover" }).stats();
  return {
    r: Math.round(stats.channels[0]?.mean ?? 250),
    g: Math.round(stats.channels[1]?.mean ?? 248),
    b: Math.round(stats.channels[2]?.mean ?? 245),
  };
}
