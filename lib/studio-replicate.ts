import Replicate from "replicate";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const MODELS = {
  rembg:
    "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
  fluxSchnell: "black-forest-labs/flux-schnell",
  sdxl:
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  svd: "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
  kling: "kwaivgi/kling-v2.1",
  llama: "meta/meta-llama-3-8b-instruct",
} as const;

export const BASE_JEWELRY_QUALITY =
  "professional luxury jewelry product photography, ultra detailed, 8k, photorealistic, elegant";

export const DEFAULT_NEGATIVE =
  "people, person, hands, fingers, face, skin, text, watermark, logo, letters, blurry, low quality, cartoon, painting, deformed, distorted jewelry";

export const BACKGROUND_NEGATIVE =
  "jewelry, ring, necklace, bracelet, earrings, diamond, product, hands, people, text, watermark, logo";

/** הודעת שגיאה ברורה מ-Replicate / Server Actions */
export function normalizeStudioError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (
      message &&
      !message.includes("Server Components render") &&
      !message.includes("digest")
    ) {
      return message;
    }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = String((error as { message: unknown }).message).trim();
    if (message) return message;
  }

  return fallback;
}

/** חילוץ URL מהפלט של Replicate */
export function extractUrl(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;

  if (typeof first === "string") return first;

  if (first && typeof first === "object" && "url" in first) {
    const url = (first as { url: () => URL | string }).url();
    return url.toString();
  }

  throw new Error("המודל לא החזיר תוצאה — נסו שוב");
}

export function extractText(output: unknown): string {
  if (typeof output === "string") return output.trim();
  if (Array.isArray(output)) return output.join("").trim();
  return String(output).trim();
}

export function hasHebrew(text: string) {
  return /[\u0590-\u05FF]/.test(text);
}

/** תרגום הנחיות עבריות לאנגלית לפרומпт AI */
export async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !hasHebrew(trimmed)) return trimmed;

  const output = await replicate.run(MODELS.llama, {
    input: {
      prompt: `Translate the following Hebrew text to English for use as an AI image/video generation prompt. Output ONLY the English translation, nothing else:\n\n${trimmed}`,
      max_tokens: 400,
      temperature: 0.1,
    },
  });

  const translated = extractText(output);
  return translated || trimmed;
}

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  filename: string,
  resourceType: "image" | "video"
) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary לא מוגדר — בדקו את משתני הסביבה");
  }

  const mime = resourceType === "video" ? "video/mp4" : "image/png";

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: mime }),
    filename
  );
  form.append("upload_preset", uploadPreset);
  form.append("folder", "yerushalmi-studio");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: form }
  );

  const json = (await response.json()) as {
    secure_url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.secure_url) {
    throw new Error(json.error?.message ?? "העלאה ל-Cloudinary נכשלה");
  }

  return json.secure_url;
}
