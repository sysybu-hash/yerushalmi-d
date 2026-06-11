import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const traced = readFileSync("branding/diamond-trace.svg", "utf8");

const vbMatch = traced.match(/viewBox="([\d.\s]+)"/);
const [, , vbW, vbH] = (vbMatch?.[1] ?? "0 0 1412 948").split(/\s+/).map(Number);
const inner = traced.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const W = 934;

const dW = 500;
const scale = dW / vbW;
const dH = vbH * scale;
const dx = (W - dW) / 2;
const dy = 56;

const textY = dy + dH + 100;
const tagY = textY + 40;
const H = tagY + 56;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect x="0" y="0" width="${W}" height="${H}" fill="#000000"/>
<g transform="translate(${dx} ${dy}) scale(${scale})">${inner}</g>
<text x="${W / 2}" y="${textY}" text-anchor="middle" font-family="serif" font-size="98" letter-spacing="10" fill="#F3F6F9">YERUSHALMI</text>
<text x="${W / 2}" y="${tagY}" text-anchor="middle" font-family="serif" font-size="20" letter-spacing="5" fill="#BFC8D1">YOUR STORY BEGINS WITH JEWELRY</text>
</svg>`;

writeFileSync("branding/logo-final.svg", svg);
console.log(`wrote branding/logo-final.svg (${W}x${H}, diamond scale ${scale.toFixed(3)})`);

await sharp(Buffer.from(svg)).resize(1400).png().toFile("branding/logo-final.png");
console.log("wrote branding/logo-final.png");
