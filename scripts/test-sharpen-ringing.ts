/**
 * בדיקת שטח: חידוד כפול על נקודה בהירה קיצונית (כמו ברק יהלום) יוצר
 * "טבעות" (ringing) קווים רדיאליים סביבה. משווה מספר המעברים ומוודא
 * שהתמונה הסופית לא עוברת חידוד אחרי ההרכבה.
 * הרצה: npx tsx scripts/test-sharpen-ringing.ts
 */
import sharp from "sharp";

async function makeBrightSpotImage(): Promise<Buffer> {
  // רקע אפור בינוני עם נקודה כמעט-לבנה במרכז — מדמה ברק יהלום על מתכת
  const svg = `<svg width="300" height="300">
    <rect width="100%" height="100%" fill="rgb(140,140,145)"/>
    <circle cx="150" cy="150" r="6" fill="rgb(252,252,255)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * "טבעת" (ringing) = פיקסל רחוק מהנקודה הבהירה (מעבר לרדיוס ה-blur הטבעי)
 * שבהיר משמעותית מרקע הבסיס (140) — סימן ל-overshoot של unsharp mask.
 */
async function ringingOvershoot(buffer: Buffer, baseBrightness = 140): Promise<number> {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const cx = 150;
  const cy = 150;
  let maxOvershoot = 0;
  for (let r = 8; r < 60; r++) {
    const x = cx + r;
    const i = (cy * w + x) * 3;
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    maxOvershoot = Math.max(maxOvershoot, brightness - baseBrightness);
  }
  return maxOvershoot;
}

async function run() {
  const base = await makeBrightSpotImage();

  // מעבר יחיד — כמו sharpenJewelryLayer בלבד
  const single = await sharp(base)
    .sharpen({ sigma: 0.85, m1: 1.15, m2: 0.45, x1: 2, y2: 10, y3: 20 })
    .png()
    .toBuffer();

  // חידוד כפול — הבאג הישן: אותו תכשיט מחודד שוב אחרי ההרכבה
  const double = await sharp(single)
    .sharpen({ sigma: 0.4, m1: 0.55, m2: 0.18, x1: 2, y2: 10, y3: 20 })
    .png()
    .toBuffer();

  const singleOvershoot = await ringingOvershoot(single);
  const doubleOvershoot = await ringingOvershoot(double);

  console.log(`מעבר חידוד יחיד — overshoot מקסימלי מהרקע: ${singleOvershoot.toFixed(1)}`);
  console.log(`חידוד כפול (הבאג הישן) — overshoot מקסימלי מהרקע: ${doubleOvershoot.toFixed(1)}`);

  const worsened = doubleOvershoot > singleOvershoot + 1;
  console.log(
    worsened
      ? "✓ אושר: חידוד כפול מגביר את הילת ה-ringing סביב נקודת הברק (זה מה שתוקן — הוסר)"
      : "— לא נמדד הבדל משמעותי בין יחיד לכפול בתרחיש זה"
  );

  process.exit(0);
}

run();
