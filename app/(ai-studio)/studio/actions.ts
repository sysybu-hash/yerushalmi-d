"use server";

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const LUXURY_PROMPT =
  "A luxury diamond jewelry piece placed on a black marble/velvet background, cinematic lighting, 8k resolution, professional jewelry photography";

/** חילוץ כתובת ה־URL מהפלט של Replicate, בכל צורה שבה הוא חוזר */
function extractUrl(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;

  if (typeof first === "string") return first;

  // replicate v1 מחזיר FileOutput עם מתודת url()
  if (first && typeof first === "object" && "url" in first) {
    const url = (first as { url: () => URL | string }).url();
    return url.toString();
  }

  throw new Error("המודל לא החזיר תוצאה — נסו שוב");
}

function assertCloudinaryUrl(imageUrl: string) {
  if (!imageUrl.startsWith("https://res.cloudinary.com/")) {
    throw new Error("כתובת התמונה אינה תקינה");
  }
}

/**
 * הפיכת צילום גולמי לתמונת מוצר יוקרתית:
 * SDXL במצב img2img עם פרומפט של צילום תכשיטים מקצועי.
 */
export async function generateLuxuryImage(imageUrl: string) {
  assertCloudinaryUrl(imageUrl);

  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        image: imageUrl,
        prompt: LUXURY_PROMPT,
        negative_prompt:
          "blurry, low quality, cartoon, painting, watermark, text, hands",
        prompt_strength: 0.55,
        num_inference_steps: 40,
        guidance_scale: 7.5,
      },
    }
  );

  return { url: extractUrl(output) };
}

/**
 * הפיכת תמונת מוצר לקליפ קולנועי קצר (~3 שניות)
 * באמצעות Stable Video Diffusion.
 */
export async function generateJewelryVideo(imageUrl: string) {
  assertCloudinaryUrl(imageUrl);

  const output = await replicate.run(
    "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
    {
      input: {
        input_image: imageUrl,
        video_length: "14_frames_with_svd",
        frames_per_second: 6,
        sizing_strategy: "maintain_aspect_ratio",
        motion_bucket_id: 40,
        cond_aug: 0.02,
      },
    }
  );

  return { url: extractUrl(output) };
}
