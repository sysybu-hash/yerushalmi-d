import { loadSharp } from "@/lib/sharp-loader";
import type { StudioStylePresetId } from "@/lib/studio-presets";
import { STUDIO_CANVAS_SIZE } from "@/lib/studio-presets";
import type { Sharp } from "sharp";

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
  tint?: { r: number; g: number; b: number },
  centerYRatio = 0.42
): Promise<Sharp> {
  const sharp = await loadSharp();
  const cx = size / 2;
  const cy = size * centerYRatio;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const t = Math.min(1, dist ** 1.28);
      const v = centerLuminance + (edgeLuminance - centerLuminance) * t;
      const i = (y * size + x) * 3;
      pixels[i] = Math.min(255, Math.round(v * (tint?.r ?? 1)));
      pixels[i + 1] = Math.min(255, Math.round(v * (tint?.g ?? 1)));
      pixels[i + 2] = Math.min(255, Math.round(v * (tint?.b ?? 1)));
    }
  }

  return sharp(pixels, { raw: { width: size, height: size, channels: 3 } });
}

function marbleVeinOverlay(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="n" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.007 0.018" numOctaves="5" seed="12" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.42 0" />
        </filter>
        <linearGradient id="v" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.22)" />
          <stop offset="40%" stop-color="rgba(210,200,188,0.1)" />
          <stop offset="100%" stop-color="rgba(70,65,58,0.28)" />
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="42%" r="48%">
          <stop offset="0%" stop-color="rgba(255,252,245,0.14)" />
          <stop offset="100%" stop-color="rgba(255,252,245,0)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" filter="url(#n)" opacity="0.5" />
      <rect width="100%" height="100%" fill="url(#spot)" />
      <path d="M ${size * 0.04} ${size * 0.32} Q ${size * 0.38} ${size * 0.26} ${size * 0.96} ${size * 0.38}" stroke="url(#v)" stroke-width="${size * 0.014}" fill="none" opacity="0.75" />
      <path d="M ${size * 0.08} ${size * 0.58} Q ${size * 0.52} ${size * 0.54} ${size * 0.92} ${size * 0.66}" stroke="rgba(255,255,255,0.14)" stroke-width="${size * 0.009}" fill="none" />
      <path d="M ${size * 0.12} ${size * 0.74} Q ${size * 0.48} ${size * 0.7} ${size * 0.88} ${size * 0.8}" stroke="rgba(185,175,162,0.18)" stroke-width="${size * 0.007}" fill="none" />
      <path d="M ${size * 0.2} ${size * 0.45} Q ${size * 0.6} ${size * 0.42} ${size * 0.78} ${size * 0.48}" stroke="rgba(255,255,255,0.08)" stroke-width="${size * 0.005}" fill="none" />
    </svg>`
  );
}

function goldRimLight(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rim" cx="50%" cy="40%" r="62%">
          <stop offset="0%" stop-color="rgba(212,175,90,0)" />
          <stop offset="68%" stop-color="rgba(212,175,90,0)" />
          <stop offset="84%" stop-color="rgba(212,175,90,0.18)" />
          <stop offset="100%" stop-color="rgba(160,125,60,0.32)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rim)" />
    </svg>`
  );
}

function subtleGrain(size: number, opacity: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>`
  );
}

function velvetTexture(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="velvet">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#velvet)" />
    </svg>`
  );
}

async function presetBase(preset: StudioStylePresetId, size: number) {
  const sharp = await loadSharp();

  switch (preset) {
    case "luxury-marble": {
      const img = await radialSpotlight(
        size,
        78,
        14,
        { r: 0.97, g: 0.94, b: 0.88 },
        0.42
      );
      const base = await img
        .linear(1.12, -8)
        .modulate({ brightness: 0.88, saturation: 0.62 })
        .png()
        .toBuffer();

      return sharp(base).composite([
        { input: marbleVeinOverlay(size), blend: "soft-light" },
        { input: goldRimLight(size), blend: "screen" },
        { input: subtleGrain(size, 0.06), blend: "overlay" },
      ]);
    }
    case "black-velvet": {
      const img = await radialSpotlight(size, 28, 4, undefined, 0.42);
      const base = await img.linear(1.08, -6).png().toBuffer();
      return sharp(base).composite([
        { input: velvetTexture(size), blend: "overlay" },
        { input: goldRimLight(size), blend: "screen" },
        { input: subtleGrain(size, 0.08), blend: "overlay" },
      ]);
    }
    case "white-studio":
      return radialSpotlight(size, 252, 228, undefined, 0.42);
    case "gold-bokeh": {
      const darkImg = await radialSpotlight(
        size,
        24,
        5,
        { r: 0.94, g: 0.9, b: 0.84 },
        0.42
      );
      const dark = await darkImg.linear(1.05, -2).png().toBuffer();
      const orbs = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="${size * 0.018}" />
            </filter>
          </defs>
          <circle cx="${size * 0.22}" cy="${size * 0.28}" r="${size * 0.09}" fill="rgba(212,175,90,0.6)" filter="url(#glow)" />
          <circle cx="${size * 0.78}" cy="${size * 0.35}" r="${size * 0.07}" fill="rgba(230,190,110,0.5)" filter="url(#glow)" />
          <circle cx="${size * 0.62}" cy="${size * 0.72}" r="${size * 0.11}" fill="rgba(198,160,80,0.4)" filter="url(#glow)" />
          <circle cx="${size * 0.35}" cy="${size * 0.68}" r="${size * 0.05}" fill="rgba(240,210,130,0.45)" filter="url(#glow)" />
        </svg>`
      );

      return sharp(dark).composite([{ input: orbs, blend: "screen" }]);
    }
    case "lifestyle": {
      const img = await radialSpotlight(
        size,
        238,
        210,
        { r: 1.02, g: 0.99, b: 0.94 },
        0.42
      );
      return img.modulate({ brightness: 1.03, saturation: 0.8 });
    }
    default:
      return radialSpotlight(size, 72, 18, undefined, 0.42);
  }
}

async function applyLightingHints(
  image: Sharp,
  hints: string,
  size: number
) {
  const flags = parseLightingHints(hints);
  let pipeline = image;

  if (flags.dramatic) {
    pipeline = pipeline.linear(1.18, -14).modulate({ brightness: 0.9 });
  }

  if (flags.bright) {
    pipeline = pipeline.modulate({ brightness: 1.06 }).linear(0.96, 10);
  }

  if (flags.gold) {
    const goldWash = Buffer.from(
      `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stop-color="rgba(212,175,90,0.24)" />
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
            <stop offset="50%" stop-color="rgba(255,255,255,0)" />
            <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
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
  const size = options.size ?? STUDIO_CANVAS_SIZE;
  const base = await presetBase(options.preset, size);
  const withHints = await applyLightingHints(
    base,
    options.lightingHints ?? "",
    size
  );

  return withHints.png().toBuffer();
}
