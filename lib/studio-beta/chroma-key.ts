import sharp from "sharp";

/**
 * הסרת רקע ירוק מינימלית — flood-fill מהשוליים בלבד פנימה. לעולם לא
 * לפי צבע-פיקסל בודד: פאות יהלום בוהקות עלולות לחלוק את אותו הצבע
 * כמו הרקע, אז רק פיקסלים המחוברים לשוליים דרך שרשרת ירוקה נהפכים
 * שקופים.
 */

type RGB = { r: number; g: number; b: number };

function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export async function chromaKeyFromEdges(
  input: Buffer,
  options?: { keyColor?: RGB; tolerance?: number }
): Promise<Buffer> {
  const keyColor = options?.keyColor ?? { r: 0, g: 255, b: 0 };
  const tolerance = options?.tolerance ?? 60;

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  const matches = (x: number, y: number): boolean => {
    const idx = y * width + x;
    const off = idx * channels;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    return colorDistance({ r, g, b }, keyColor) < tolerance;
  };

  const seed = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    if (!matches(x, y)) return;
    visited[idx] = 1;
    stack.push(x, y);
  };

  for (let x = 0; x < width; x++) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop()!;
    const x = stack.pop()!;
    const off = (y * width + x) * channels;
    data[off + 3] = 0;
    seed(x + 1, y);
    seed(x - 1, y);
    seed(x, y + 1);
    seed(x, y - 1);
  }

  return sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}
