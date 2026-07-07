/**
 * בדיקת שטח לצנרת הבידוד — מדמה פלטים של Gemini (מסכי צבע שונים)
 * ומוודא שהרקע מוסר או שנזרקת שגיאה ברורה (לא זבל שקט).
 * הרצה: npx tsx scripts/test-cutout-chroma.ts
 */
import sharp from "sharp";
import {
  normalizeJewelryCutout,
  tryProceduralJewelryCutout,
} from "../lib/studio-composite";

async function makeTestImage(bg: { r: number; g: number; b: number }) {
  // "תכשיט" — אליפסה אפורה-בהירה עם ניואנסים, על רקע צבעוני מלא
  const size = 512;
  const svg = `<svg width="${size}" height="${size}">
    <rect width="100%" height="100%" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
    <ellipse cx="256" cy="280" rx="110" ry="150" fill="rgb(214,214,220)"/>
    <ellipse cx="256" cy="230" rx="45" ry="60" fill="rgb(90,110,220)"/>
    <circle cx="256" cy="160" r="18" fill="rgb(240,240,245)"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function opaqueRatio(buffer: Buffer): Promise<number> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 140) opaque++;
  return opaque / (info.width * info.height);
}

async function run() {
  const cases = [
    { name: "מסך ירוק בהיר (0,255,0)", bg: { r: 0, g: 255, b: 0 }, expectClean: true },
    { name: "ירוק כהה (20,150,60) — הבאג שדווח", bg: { r: 20, g: 150, b: 60 }, expectClean: true },
    { name: "ירוק-קלי (30,170,80)", bg: { r: 30, g: 170, b: 80 }, expectClean: true },
    { name: "טורקיז (0,180,180)", bg: { r: 0, g: 180, b: 180 }, expectClean: true },
    { name: "מג'נטה (200,40,180)", bg: { r: 200, g: 40, b: 180 }, expectClean: true },
    { name: "רקע לבן (245,245,245)", bg: { r: 245, g: 245, b: 245 }, expectClean: true },
  ];

  let failed = 0;
  for (const test of cases) {
    const image = await makeTestImage(test.bg);
    try {
      const result = await normalizeJewelryCutout(image);
      const ratio = await opaqueRatio(result);
      const ok = ratio > 0.05 && ratio < 0.5; // רק ה"תכשיט" נשאר (~23%)
      console.log(
        `${ok ? "✓" : "✗"} ${test.name}: opaqueRatio=${ratio.toFixed(3)} ${ok ? "" : "— הרקע לא הוסר כמו שצריך!"}`
      );
      if (!ok) failed++;
    } catch (e) {
      // שגיאה ברורה עדיפה על זבל שקט — אבל במקרים האלה מצפים להצלחה
      console.log(`✗ ${test.name}: נזרקה שגיאה — ${(e as Error).message}`);
      failed++;
    }
  }

  // מקרה קצה: תמונה שכולה רקע עמוס (בלי תכשיט) — חייבת לזרוק, לא להחזיר זבל
  const noise = await sharp(
    Buffer.from(
      `<svg width="512" height="512"><rect width="100%" height="100%" fill="rgb(120,100,90)"/></svg>`
    )
  )
    .png()
    .toBuffer();
  try {
    await normalizeJewelryCutout(noise);
    console.log("✗ תמונת רקע-בלבד: עברה בלי שגיאה — זבל שקט!");
    failed++;
  } catch {
    console.log("✓ תמונת רקע-בלבד: נזרקה שגיאה ברורה (כצפוי)");
  }

  // פרוצדורלי: קופסה כהה סביב — חייב לוותר (fallback ל-AI), לא לחתוך זבל
  const boxImage = await sharp(
    Buffer.from(`<svg width="512" height="512">
      <rect width="100%" height="100%" fill="rgb(60,55,50)"/>
      <rect x="80" y="80" width="352" height="352" fill="rgb(230,230,235)"/>
      <ellipse cx="256" cy="256" rx="60" ry="80" fill="rgb(90,110,220)"/>
    </svg>`)
  )
    .png()
    .toBuffer();
  const procedural = await tryProceduralJewelryCutout(boxImage);
  if (procedural === null) {
    console.log("✓ צילום עם קופסה כהה: הפרוצדורלי ויתר (יעבור ל-AI, כצפוי)");
  } else {
    console.log("✗ צילום עם קופסה כהה: הפרוצדורלי 'הצליח' — זה הבאג הישן!");
    failed++;
  }

  console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILURES`);
  process.exit(failed === 0 ? 0 : 1);
}

run();
