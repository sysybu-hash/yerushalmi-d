import sharp from "sharp";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";

// 1) לוגו מלא וקטורי + רסטר (רקע שחור)
copyFileSync("branding/logo-final.svg", "public/logo.svg");
await sharp("branding/logo-final.svg").resize(1000).png().toFile("public/logo-full.png");
console.log("wrote public/logo.svg, public/logo-full.png");

// 2) סמל היהלום ברקע שקוף (לניווט, פוטר, favicon) — אלפא לפי בהירות
async function transparentMark(size, outPath) {
  const { data, info } = await sharp("branding/diamond-trace.svg")
    .resize(size, size, { fit: "contain", background: "#000000" })
    .flatten({ background: "#000000" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
    const a = Math.max(0, Math.min(255, Math.round((lum - 14) * 5)));
    data[i + 3] = a;
  }

  await sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath} (${info.width}x${info.height})`);
}

await transparentMark(512, "public/logo-mark.png");
await transparentMark(256, "app/icon.png");
