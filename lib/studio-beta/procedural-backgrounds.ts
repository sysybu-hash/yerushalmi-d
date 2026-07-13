import sharp from "sharp";

/**
 * רקעים פרוצדורליים למנוע החינמי — בלוקי SVG ניתנים-להרכבה, בלי קריאת
 * AI. כל בלוק הוא פונקציה טהורה שמחזירה defs/body; קומפוזיציה לכל
 * פריסט מרכיבה שכבת בסיס + overlays אופציונליים, לא class hierarchy.
 */

type Layer = { defs: string; body: string };
type ColorStop = { offset: string; color: string; opacity?: number };

let layerId = 0;
function nextId(prefix: string): string {
  layerId += 1;
  return `${prefix}${layerId}`;
}

/** PRNG דטרמיניסטי פשוט (mulberry32) — תוצאה יציבה לפי seed, בלי Math.random */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradientStops(stops: ColorStop[]): string {
  return stops
    .map(
      (s) =>
        `<stop offset="${s.offset}" stop-color="${s.color}"${
          s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : ""
        } />`
    )
    .join("");
}

/** שכבת בסיס: גרדיאנט רדיאלי או ליניארי שממלא את כל הקנבס */
function baseGradient(
  stops: ColorStop[],
  opts?: { type?: "radial" | "linear"; cx?: string; cy?: string; r?: string; angle?: number }
): (size: number) => Layer {
  return (size: number) => {
    const id = nextId("base");
    const type = opts?.type ?? "radial";
    if (type === "linear") {
      const angle = opts?.angle ?? 135;
      const rad = (angle * Math.PI) / 180;
      const x2 = (50 + 50 * Math.cos(rad)).toFixed(1);
      const y2 = (50 + 50 * Math.sin(rad)).toFixed(1);
      const x1 = (50 - 50 * Math.cos(rad)).toFixed(1);
      const y1 = (50 - 50 * Math.sin(rad)).toFixed(1);
      return {
        defs: `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${gradientStops(
          stops
        )}</linearGradient>`,
        body: `<rect width="${size}" height="${size}" fill="url(#${id})" />`,
      };
    }
    return {
      defs: `<radialGradient id="${id}" cx="${opts?.cx ?? "50%"}" cy="${
        opts?.cy ?? "42%"
      }" r="${opts?.r ?? "70%"}">${gradientStops(stops)}</radialGradient>`,
      body: `<rect width="${size}" height="${size}" fill="url(#${id})" />`,
    };
  };
}

/** כתם אור רך נוסף מעל הבסיס */
function spotlight(
  color: string,
  opacity = 0.35,
  cx = "50%",
  cy = "38%",
  r = "45%"
): (size: number) => Layer {
  return (size: number) => {
    const id = nextId("spot");
    return {
      defs: `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
        <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}" />
        <stop offset="100%" stop-color="${color}" stop-opacity="0" />
      </radialGradient>`,
      body: `<rect width="${size}" height="${size}" fill="url(#${id})" />`,
    };
  };
}

/** כהות עדינה בשוליים */
function vignette(opacity = 0.32): (size: number) => Layer {
  return (size: number) => {
    const id = nextId("vig");
    return {
      defs: `<radialGradient id="${id}" cx="50%" cy="50%" r="72%">
        <stop offset="55%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="${opacity}" />
      </radialGradient>`,
      body: `<rect width="${size}" height="${size}" fill="url(#${id})" />`,
    };
  };
}

/** עיגולי בוקה מטושטשים מפוזרים, ממוקמים דטרמיניסטית לפי seed */
function bokehCircles(
  colors: string[],
  count = 9,
  seed = 42
): (size: number) => Layer {
  return (size: number) => {
    const rand = seededRandom(seed);
    const filterId = nextId("bokehBlur");
    const blur = size * 0.02;
    const circles = Array.from({ length: count }, () => {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = size * (0.04 + rand() * 0.09);
      const color = colors[Math.floor(rand() * colors.length)];
      const opacity = 0.25 + rand() * 0.35;
      return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(
        1
      )}" fill="${color}" opacity="${opacity.toFixed(2)}" />`;
    }).join("");
    return {
      defs: `<filter id="${filterId}"><feGaussianBlur stdDeviation="${blur.toFixed(
        1
      )}" /></filter>`,
      body: `<g filter="url(#${filterId})">${circles}</g>`,
    };
  };
}

/** פס-אור אלכסוני רך (שמפניה/רוז-גולד/זכוכית) */
function diagonalSheen(color: string, opacity = 0.3, angle = 115): (size: number) => Layer {
  return (size: number) => {
    const id = nextId("sheen");
    const rad = (angle * Math.PI) / 180;
    const x2 = (50 + 50 * Math.cos(rad)).toFixed(1);
    const y2 = (50 + 50 * Math.sin(rad)).toFixed(1);
    const x1 = (50 - 50 * Math.cos(rad)).toFixed(1);
    const y1 = (50 - 50 * Math.sin(rad)).toFixed(1);
    return {
      defs: `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="35%" stop-color="${color}" stop-opacity="0" />
        <stop offset="50%" stop-color="${color}" stop-opacity="${opacity}" />
        <stop offset="65%" stop-color="${color}" stop-opacity="0" />
      </linearGradient>`,
      body: `<rect width="${size}" height="${size}" fill="url(#${id})" />`,
    };
  };
}

/** טקסטורת גרעיניות עדינה (שיש/אבן/בטון) */
function grainTexture(opacity = 0.1): (size: number) => Layer {
  return () => {
    const filterId = nextId("grain");
    return {
      defs: `<filter id="${filterId}">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0" />
      </filter>`,
      body: `<rect width="100%" height="100%" filter="url(#${filterId})" />`,
    };
  };
}

type BackgroundComposition = {
  base: (size: number) => Layer;
  overlays: Array<(size: number) => Layer>;
};

const PROCEDURAL_COMPOSITIONS: Record<string, BackgroundComposition> = {
  "white-studio": {
    base: baseGradient([
      { offset: "0%", color: "#FDFCFA" },
      { offset: "100%", color: "#E7E2D8" },
    ]),
    overlays: [],
  },
  "luxury-marble": {
    base: baseGradient([
      { offset: "0%", color: "#EFEAE0" },
      { offset: "55%", color: "#D9D2C4" },
      { offset: "100%", color: "#BEB4A0" },
    ]),
    overlays: [grainTexture(0.14), spotlight("#F3E7C9", 0.25)],
  },
  "black-velvet": {
    base: baseGradient([
      { offset: "0%", color: "#2A2621" },
      { offset: "100%", color: "#0A0906" },
    ]),
    overlays: [spotlight("#FFFFFF", 0.22, "50%", "35%", "40%"), vignette(0.45)],
  },
  "gold-bokeh": {
    base: baseGradient([
      { offset: "0%", color: "#3A2E17" },
      { offset: "100%", color: "#120D06" },
    ]),
    overlays: [bokehCircles(["#D9A84E", "#F4D488", "#8C6A2E"], 10, 101)],
  },
  "champagne-silk": {
    base: baseGradient(
      [
        { offset: "0%", color: "#F3E9D4" },
        { offset: "100%", color: "#DCC9A3" },
      ],
      { type: "linear", angle: 120 }
    ),
    overlays: [diagonalSheen("#FFFDF6", 0.4)],
  },
  lifestyle: {
    base: baseGradient([
      { offset: "0%", color: "#EFE3CE" },
      { offset: "100%", color: "#C9B79C" },
    ]),
    overlays: [spotlight("#FFF6E4", 0.3)],
  },
  "midnight-blue": {
    base: baseGradient([
      { offset: "0%", color: "#293A5C" },
      { offset: "100%", color: "#0C1526" },
    ]),
    overlays: [spotlight("#7FA6E0", 0.22, "50%", "35%", "42%"), vignette(0.4)],
  },
  "rose-gold-glow": {
    base: baseGradient([
      { offset: "0%", color: "#EFCEC0" },
      { offset: "100%", color: "#C1897A" },
    ]),
    overlays: [diagonalSheen("#FFEDE4", 0.35), spotlight("#FBD9C9", 0.3)],
  },
  "jerusalem-stone": {
    base: baseGradient([
      { offset: "0%", color: "#E7DCC1" },
      { offset: "100%", color: "#C7B78D" },
    ]),
    overlays: [grainTexture(0.16), spotlight("#F7E9C4", 0.28, "50%", "30%", "50%")],
  },
  "concrete-minimal": {
    base: baseGradient([
      { offset: "0%", color: "#BDB9B0" },
      { offset: "100%", color: "#93908A" },
    ]),
    overlays: [grainTexture(0.12)],
  },
  "mirror-glass": {
    base: baseGradient(
      [
        { offset: "0%", color: "#EEF3F5" },
        { offset: "100%", color: "#C4D0D6" },
      ],
      { type: "linear", angle: 100 }
    ),
    overlays: [diagonalSheen("#FFFFFF", 0.45, 105), vignette(0.18)],
  },
  "botanical-soft": {
    base: baseGradient([
      { offset: "0%", color: "#D8E0C8" },
      { offset: "100%", color: "#A5B48F" },
    ]),
    overlays: [vignette(0.22)],
  },
};

const DEFAULT_COMPOSITION_ID = "white-studio";

/** מרכיבה ומרנדרת רקע פרוצדורלי לפי מזהה פריסט; נופלת לברירת מחדל לפריסט לא מוכר */
export async function renderProceduralBackground(
  presetId?: string | null,
  size = 2048
): Promise<Buffer> {
  const composition: BackgroundComposition =
    (presetId ? PROCEDURAL_COMPOSITIONS[presetId] : undefined) ??
    PROCEDURAL_COMPOSITIONS[DEFAULT_COMPOSITION_ID];

  const layers = [composition.base(size), ...composition.overlays.map((fn) => fn(size))];
  const defs = layers.map((l) => l.defs).join("");
  const body = layers.map((l) => l.body).join("");

  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>${defs}</defs>
      ${body}
    </svg>`
  );
  return sharp(svg).png().toBuffer();
}
