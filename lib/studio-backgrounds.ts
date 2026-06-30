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
      const distX = (x - cx) / (size * 0.52);
      const distY = (y - cy) / (size * 0.46);
      const dist = Math.sqrt(distX * distX + distY * distY);
      const t = Math.min(1, dist ** 2.15);
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
        <radialGradient id="spot" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stop-color="rgba(255,252,245,0.08)" />
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
        <radialGradient id="rim" cx="50%" cy="44%" r="78%">
          <stop offset="0%" stop-color="rgba(212,175,90,0)" />
          <stop offset="88%" stop-color="rgba(212,175,90,0)" />
          <stop offset="96%" stop-color="rgba(212,175,90,0.08)" />
          <stop offset="100%" stop-color="rgba(140,110,55,0.14)" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rim)" />
    </svg>`
  );
}

/** בוקה רך ללא עיגולים חדים — טקסטורה מטושטשת */
function softBokehWash(
  size: number,
  rgb: { r: number; g: number; b: number },
  opacity = 0.14
): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="bokeh">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="3" seed="19" />
          <feGaussianBlur stdDeviation="${size * 0.028}" />
          <feColorMatrix type="matrix" values="0 0 0 0 ${rgb.r / 255}  0 0 0 0 ${rgb.g / 255}  0 0 0 0 ${rgb.b / 255}  0 0 0 ${opacity} 0" />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#bokeh)" />
    </svg>`
  );
}

/** גרדיאנט ליניארי חלק — קטלוג יוקרתי */
function linearBackdrop(
  size: number,
  top: string,
  bottom: string
): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${top}" />
          <stop offset="100%" stop-color="${bottom}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
    </svg>`
  );
}

async function polishLuxuryBackground(image: Sharp): Promise<Buffer> {
  return image.blur(0.28).png({ compressionLevel: 6 }).toBuffer();
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
    case "white-studio": {
      const base = await sharp(
        linearBackdrop(size, "#fcfcfc", "#e4e4e4")
      )
        .png()
        .toBuffer();
      return sharp(base).composite([
        { input: subtleGrain(size, 0.04), blend: "overlay" },
      ]);
    }
    case "gold-bokeh": {
      const base = await sharp(
        linearBackdrop(size, "#2a2620", "#0f0e0c")
      )
        .png()
        .toBuffer();
      return sharp(base).composite([
        { input: softBokehWash(size, { r: 212, g: 175, b: 90 }, 0.12), blend: "screen" },
        { input: subtleGrain(size, 0.06), blend: "overlay" },
      ]);
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
    case "rose-gold-glow": {
      const base = await sharp(
        linearBackdrop(size, "#fff4f0", "#e8c8bc")
      )
        .modulate({ brightness: 1.02, saturation: 0.68 })
        .png()
        .toBuffer();
      return sharp(base).composite([
        { input: softBokehWash(size, { r: 255, g: 200, b: 190 }, 0.1), blend: "soft-light" },
        { input: subtleGrain(size, 0.05), blend: "overlay" },
      ]);
    }
    case "midnight-blue": {
      const img = await radialSpotlight(
        size,
        32,
        6,
        { r: 0.72, g: 0.82, b: 1.05 },
        0.42
      );
      const base = await img.linear(1.1, -8).png().toBuffer();
      const coolRim = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cool" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(120,150,210,0.08)" />
              <stop offset="100%" stop-color="rgba(20,30,60,0.22)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#cool)" />
        </svg>`
      );
      return sharp(base).composite([
        { input: velvetTexture(size), blend: "overlay" },
        { input: coolRim, blend: "screen" },
      ]);
    }
    case "champagne-silk": {
      const img = await radialSpotlight(
        size,
        248,
        215,
        { r: 1.04, g: 1.0, b: 0.9 },
        0.4
      );
      const base = await img.modulate({ brightness: 1.05, saturation: 0.65 }).png().toBuffer();
      const silk = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="silk">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="21" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.18 0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#silk)" opacity="0.7" />
        </svg>`
      );
      return sharp(base).composite([{ input: silk, blend: "soft-light" }]);
    }
    case "jerusalem-stone": {
      const img = await radialSpotlight(
        size,
        200,
        155,
        { r: 1.06, g: 0.98, b: 0.86 },
        0.42
      );
      const base = await img.modulate({ brightness: 1.02, saturation: 0.7 }).png().toBuffer();
      const stone = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="stone">
              <feTurbulence type="fractalNoise" baseFrequency="0.009 0.022" numOctaves="4" seed="33" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0" />
            </filter>
          </defs>
          <rect width="100%" height="100%" filter="url(#stone)" opacity="0.55" />
          <path d="M ${size * 0.05} ${size * 0.4} Q ${size * 0.45} ${size * 0.35} ${size * 0.95} ${size * 0.45}" stroke="rgba(210,185,150,0.2)" stroke-width="${size * 0.008}" fill="none" />
        </svg>`
      );
      return sharp(base).composite([{ input: stone, blend: "multiply" }]);
    }
    case "concrete-minimal": {
      const img = await radialSpotlight(size, 235, 205, { r: 0.96, g: 0.97, b: 0.98 }, 0.42);
      const base = await img.linear(0.98, 8).png().toBuffer();
      return sharp(base).composite([
        { input: subtleGrain(size, 0.1), blend: "overlay" },
      ]);
    }
    case "botanical-soft": {
      const base = await sharp(
        linearBackdrop(size, "#f6f9f4", "#d4e0cc")
      )
        .png()
        .toBuffer();
      return sharp(base).composite([
        { input: softBokehWash(size, { r: 140, g: 175, b: 130 }, 0.1), blend: "multiply" },
        { input: subtleGrain(size, 0.05), blend: "overlay" },
      ]);
    }
    case "mirror-glass": {
      const img = await radialSpotlight(size, 45, 8, { r: 0.92, g: 0.94, b: 0.98 }, 0.38);
      const base = await img.linear(1.2, -12).png().toBuffer();
      const glass = Buffer.from(
        `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="refl" x1="0" y1="0.55" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(255,255,255,0)" />
              <stop offset="55%" stop-color="rgba(255,255,255,0.06)" />
              <stop offset="100%" stop-color="rgba(200,220,255,0.18)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#refl)" />
        </svg>`
      );
      return sharp(base).composite([{ input: glass, blend: "screen" }]);
    }
    case "royal-purple": {
      const img = await radialSpotlight(
        size,
        38,
        8,
        { r: 0.88, g: 0.78, b: 1.08 },
        0.42
      );
      const base = await img.linear(1.12, -10).png().toBuffer();
      return sharp(base).composite([
        { input: velvetTexture(size), blend: "overlay" },
        { input: goldRimLight(size), blend: "soft-light" },
      ]);
    }
    case "sunset-amber": {
      const base = await sharp(
        linearBackdrop(size, "#fff6e8", "#c88848")
      )
        .modulate({ brightness: 1.04, saturation: 0.78 })
        .png()
        .toBuffer();
      return sharp(base).composite([
        { input: softBokehWash(size, { r: 255, g: 190, b: 100 }, 0.1), blend: "screen" },
        { input: subtleGrain(size, 0.05), blend: "overlay" },
      ]);
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
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(212,175,90,0.1)" />
            <stop offset="100%" stop-color="rgba(212,175,90,0)" />
          </linearGradient>
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

  return polishLuxuryBackground(withHints);
}
