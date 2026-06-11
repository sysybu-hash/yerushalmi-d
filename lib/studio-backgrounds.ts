import sharp from "sharp";

import type { StudioStylePresetId } from "@/lib/studio-presets";

type BackgroundOptions = {
  preset: StudioStylePresetId;
  /** מילות מפתח באנגלית לכיוונון תאורה/גוון — לא יוצרות תכשיטים */
  lightingHints?: string;
  size?: number;
};

function parseLightingHints(hints: string) {
  const text = hints.toLowerCase();
  return {
    dramatic: /dramatic|cinema|cinematic|moody|dark/.test(text),
    gold: /gold|warm|champagne|golden/.test(text),
    bright: /bright|white|clean|catalog|soft light|diffused/.test(text),
    reflection: /reflect|glass|mirror|shine|sparkle|glitter/.test(text),
  };
}

async function radialSpotlight(
  size: number,
  centerLuminance: number,
  edgeLuminance: number,
  tint?: { r: number; g: number; b: number }
) {
  const cx = size / 2;
  const cy = size / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const t = Math.min(1, dist ** 1.4);
      const v = centerLuminance + (edgeLuminance - centerLuminance) * t;
      const i = (y * size + x) * 3;
      pixels[i] = Math.min(255, Math.round(v * (tint?.r ?? 1)));
      pixels[i + 1] = Math.min(255, Math.round(v * (tint?.g ?? 1)));
      pixels[i + 2] = Math.min(255, Math.round(v * (tint?.b ?? 1)));
    }
  }

  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } });
}

async function presetBase(preset: StudioStylePresetId, size: number) {
  switch (preset) {
    case "luxury-marble": {
      const img = await radialSpotlight(size, 78, 14, {
        r: 1,
        g: 0.98,
        b: 0.95,
      });
      return img.linear(1.1, -6).modulate({ brightness: 0.9, saturation: 0.4 });
    }
    case "black-velvet":
      return radialSpotlight(size, 28, 6);
    case "white-studio":
      return radialSpotlight(size, 252, 228);
    case "gold-bokeh": {
      const darkImg = await radialSpotlight(size, 22, 4);
      const dark = await darkImg.png().toBuffer();
      const orbs = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <circle cx="${size * 0.22}" cy="${size * 0.28}" r="${size * 0.09}" fill="rgba(212,175,90,0.55)" />
          <circle cx="${size * 0.78}" cy="${size * 0.35}" r="${size * 0.07}" fill="rgba(230,190,110,0.45)" />
          <circle cx="${size * 0.62}" cy="${size * 0.72}" r="${size * 0.11}" fill="rgba(198,160,80,0.35)" />
          <circle cx="${size * 0.35}" cy="${size * 0.68}" r="${size * 0.05}" fill="rgba(240,210,130,0.4)" />
        </svg>`
      );

      return sharp(dark).composite([{ input: orbs, blend: "screen" }]);
    }
    case "lifestyle": {
      const img = await radialSpotlight(size, 238, 210, {
        r: 1.02,
        g: 0.99,
        b: 0.94,
      });
      return img.modulate({ brightness: 1.03, saturation: 0.8 });
    }
    default:
      return radialSpotlight(size, 72, 18);
  }
}

async function applyLightingHints(
  image: Awaited<ReturnType<typeof radialSpotlight>>,
  hints: string,
  size: number
) {
  const flags = parseLightingHints(hints);
  let pipeline = image;

  if (flags.dramatic) {
    pipeline = pipeline.linear(1.25, -18).modulate({ brightness: 0.88 });
  }

  if (flags.bright) {
    pipeline = pipeline.modulate({ brightness: 1.08 }).linear(0.95, 12);
  }

  if (flags.gold) {
    const goldWash = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stop-color="rgba(212,175,90,0.28)" />
            <stop offset="100%" stop-color="rgba(212,175,90,0)" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>`
    );
    pipeline = pipeline.composite([{ input: goldWash, blend: "soft-light" }]);
  }

  if (flags.reflection) {
    const gloss = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="55%" stop-color="rgba(255,255,255,0)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0.12)" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#r)" />
      </svg>`
    );
    pipeline = pipeline.composite([{ input: gloss, blend: "overlay" }]);
  }

  return pipeline;
}

/** רקע יוקרתי דטרמיניסטי — ללא AI, בלי תכשיטים מומצאים */
export async function generatePresetBackground(
  options: BackgroundOptions
): Promise<Buffer> {
  const size = options.size ?? 1024;
  const base = await presetBase(options.preset, size);
  const withHints = await applyLightingHints(
    base,
    options.lightingHints ?? "",
    size
  );

  return withHints.png().toBuffer();
}
