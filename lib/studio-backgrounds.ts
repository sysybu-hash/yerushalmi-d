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
  tint?: { r: number; g: number; b: number }
): Promise<Sharp> {
  const sharp = await loadSharp();
  const cx = size / 2;
  const cy = size / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  const pixels = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist;
      const t = Math.min(1, dist ** 1.35);
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
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="4" seed="12" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0" />
        </filter>
        <linearGradient id="v" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="45%" stop-color="rgba(200,195,188,0.08)" />
          <stop offset="100%" stop-color="rgba(80,75,70,0.22)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" filter="url(#n)" opacity="0.45" />
      <path d="M ${size * 0.05} ${size * 0.35} Q ${size * 0.4} ${size * 0.28} ${size * 0.95} ${size * 0.42}" stroke="url(#v)" stroke-width="${size * 0.012}" fill="none" opacity="0.7" />
      <path d="M ${size * 0.1} ${size * 0.62} Q ${size * 0.55} ${size * 0.58} ${size * 0.9} ${size * 0.7}" stroke="rgba(255,255,255,0.12)" stroke-width="${size * 0.008}" fill="none" />
      <path d="M ${size * 0.15} ${size * 0.78} Q ${size * 0.5} ${size * 0.72} ${size * 0.85} ${size * 0.82}" stroke="rgba(180,175,168,0.15)" stroke-width="${size * 0.006}" fill="none" />
    </svg>`
  );
}

function goldRimLight(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rim" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stop-color="rgba(212,175,90,0)" />
          <stop offset="72%" stop-color="rgba(212,175,90,0)" />
          <stop offset="88%" stop-color="rgba(212,175,90,0.22)" />
          <stop offset="100%" stop-color="rgba(180,140,70,0.35)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rim)" />
    </svg>`
  );
}

function velvetTexture(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="velvet">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0" />
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
      const img = await radialSpotlight(size, 52, 6, {
        r: 0.96,
        g: 0.94,
        b: 0.9,
      });
      const base = await img
        .linear(1.18, -10)
        .modulate({ brightness: 0.82, saturation: 0.55 })
        .png()
        .toBuffer();

      return sharp(base).composite([
        { input: marbleVeinOverlay(size), blend: "soft-light" },
        { input: goldRimLight(size), blend: "screen" },
      ]);
    }
    case "black-velvet": {
      const img = await radialSpotlight(size, 22, 3);
      const base = await img.linear(1.1, -4).png().toBuffer();
      return sharp(base).composite([
        { input: velvetTexture(size), blend: "overlay" },
        { input: goldRimLight(size), blend: "screen" },
      ]);
    }
    case "white-studio":
      return radialSpotlight(size, 252, 228);
    case "gold-bokeh": {
      const darkImg = await radialSpotlight(size, 18, 2, {
        r: 0.92,
        g: 0.88,
        b: 0.82,
      });
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
  image: Sharp,
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
  const size = options.size ?? STUDIO_CANVAS_SIZE;
  const base = await presetBase(options.preset, size);
  const withHints = await applyLightingHints(
    base,
    options.lightingHints ?? "",
    size
  );

  return withHints.png().toBuffer();
}
