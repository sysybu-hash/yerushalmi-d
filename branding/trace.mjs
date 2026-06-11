import sharp from "sharp";
import ImageTracer from "imagetracerjs";
import { writeFileSync } from "node:fs";

const SRC = process.argv[2] ?? "branding/logo-src-diamond.png";
const OUT = process.argv[3] ?? "branding/diamond-trace.svg";
const UPSCALE = Number(process.argv[4] ?? 3);
const COLORS = Number(process.argv[5] ?? 16);

const meta = await sharp(SRC).metadata();
const w = Math.round(meta.width * UPSCALE);
const h = Math.round(meta.height * UPSCALE);

const { data, info } = await sharp(SRC)
  .resize(w, h, { kernel: "lanczos3" })
  .linear(1.55, -48)
  .median(1)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const imgData = {
  width: info.width,
  height: info.height,
  data: new Uint8ClampedArray(data),
};

const options = {
  numberofcolors: COLORS,
  colorsampling: 2,
  mincolorratio: 0,
  colorquantcycles: 5,
  pathomit: 6,
  ltres: 1,
  qtres: 1,
  blurradius: 1,
  blurdelta: 20,
  strokewidth: 0,
  linefilter: true,
  scale: 1,
  roundcoords: 2,
  viewbox: true,
};

const svg = ImageTracer.imagedataToSVG(imgData, options);
writeFileSync(OUT, svg);
console.log(`wrote ${OUT} (${info.width}x${info.height}, ${COLORS} colors)`);

await sharp(Buffer.from(svg))
  .resize(700)
  .png()
  .toFile(OUT.replace(/\.svg$/, "-preview.png"));
console.log("wrote preview png");
