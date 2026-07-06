import Replicate from "replicate";
import {
  assertStudioQuota,
  extractReplicatePredictTime,
  trackAiUsage,
  type AiUsageCapability,
  type AiUsageMode,
} from "@/lib/ai-usage";

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  // URL strings are easier to serialize and pass to Cloudinary/rembg downstream.
  useFileOutput: false,
});

export const MODELS = {
  /** Bria RMBG 2.0 — 256-level alpha matte, far sharper on fine jewelry detail than cjwbw/rembg */
  rembg:
    "bria/remove-background:5ecc270b34e9d8e1f007d9dbd3c724f0badf638f05ffaa0c5e0634ed64d3d378",
  fluxSchnell: "black-forest-labs/flux-schnell",
  sdxl:
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  svd: "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
  kling: "kwaivgi/kling-v3-video",
  /** Llama 3.3 70B — טקסט ותרגום בעברית */
  llama: "lucataco/ollama-llama3.3-70b",
  /** Moondream2 (2024-07-23) — זיהוי תמונה מהיר */
  moondream: "lucataco/moondream2",
  /** LLaVA 1.5 13B — גיבוי לניתוח תמונה */
  llava:
    "yorickvp/llava-13b:80537f9eead1a5bfa72d5ac6ea6414379be41d4d4f6679fd776e9535d1eb58bb",
} as const;

export const BASE_JEWELRY_QUALITY =
  "professional luxury jewelry product photography, ultra detailed, 8k, photorealistic, elegant";

export const DEFAULT_NEGATIVE =
  "people, person, hands, fingers, face, skin, text, watermark, logo, letters, blurry, low quality, cartoon, painting, deformed, distorted jewelry";

export const BACKGROUND_NEGATIVE =
  "jewelry, ring, necklace, bracelet, earrings, diamond, product, hands, people, text, watermark, logo";

/** שגיאות Replicate שמצדיקות מעבר ל-Gemini במצב אוטומטי */
export function isReplicateFallbackError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  return /402|401|insufficient credit|אין מספיק קרדיט|unauthorized|rate limit|billing|payment|out of credits/i.test(
    message
  );
}
/** הודעת שגיאה ברורה מ-Replicate / Server Actions */
export function normalizeStudioError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (
      message &&
      !message.includes("Server Components render") &&
      !message.includes("digest")
    ) {
      if (message.includes("401") || /unauthorized/i.test(message)) {
        return "מפתח Replicate לא תקין — בדקו את REPLICATE_API_TOKEN ב-Vercel.";
      }
      if (message.includes("402") || /insufficient credit/i.test(message)) {
        return "אין מספיק קרדיט ב-Replicate — הוסיפו אשראי בחשבון Replicate.";
      }
      if (message.includes("422") || /invalid version|no enabled versions/i.test(message)) {
        return "מודל ניתוח התמונה לא זמין כרגע — נסו שוב בעוד דקה.";
      }
      return message;
    }
  }

  if (typeof error === "object" && error !== null) {
    if ("message" in error) {
      const message = String((error as { message: unknown }).message).trim();
      if (message) return message;
    }
    if ("detail" in error) {
      const detail = String((error as { detail: unknown }).detail).trim();
      if (detail) return detail;
    }
  }

  return fallback;
}

/** חילוץ URL מהפלט של Replicate */
export function extractUrl(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;

  if (typeof first === "string" && first.startsWith("http")) return first;

  if (first && typeof first === "object") {
    if ("url" in first && typeof (first as { url: unknown }).url === "function") {
      const url = (first as { url: () => URL | string }).url();
      return url.toString();
    }
    if (typeof (first as { toString?: () => string }).toString === "function") {
      const asString = (first as { toString: () => string }).toString();
      if (asString.startsWith("http")) return asString;
    }
    const asString = String(first);
    if (asString.startsWith("http")) return asString;
  }

  throw new Error("המודל לא החזיר תוצאה — נסו שוב");
}

export function extractText(output: unknown): string {
  if (typeof output === "string") return output.trim();
  if (Array.isArray(output)) {
    return output.map((chunk) => (typeof chunk === "string" ? chunk : String(chunk))).join("").trim();
  }
  if (output && typeof output === "object") {
    if ("output" in output && typeof (output as { output: unknown }).output === "string") {
      return (output as { output: string }).output.trim();
    }
  }
  const asString = String(output).trim();
  return asString === "[object Object]" ? "" : asString;
}

/** איסוף פלט טקסט מ-Replicate — כולל מודלים שמחזירים איטרטור */
export async function collectReplicateText(output: unknown): Promise<string> {
  if (
    output &&
    typeof output === "object" &&
    Symbol.asyncIterator in (output as object)
  ) {
    let text = "";
    for await (const chunk of output as AsyncIterable<unknown>) {
      text += typeof chunk === "string" ? chunk : String(chunk);
    }
    return text.trim();
  }

  return extractText(output);
}

export function hasHebrew(text: string) {
  return /[\u0590-\u05FF]/.test(text);
}

/** תרגום הנחיות עבריות לאנגלית לפרומפט AI */
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

export async function runTrackedReplicate(
  modelId: string,
  input: Record<string, unknown>,
  options: {
    capability: AiUsageCapability;
    mode?: AiUsageMode;
    projectId?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<unknown> {
  await assertStudioQuota(options.capability);
  const started = Date.now();
  let success = false;
  let billedUnits: number | null = null;

  try {
    const output = await replicate.run(modelId as `${string}/${string}`, {
      input,
    });
    success = true;
    billedUnits = extractReplicatePredictTime(output);
    return output;
  } catch (error) {
    success = false;
    throw error;
  } finally {
    await trackAiUsage({
      provider: "replicate",
      capability: options.capability,
      modelId,
      mode: options.mode ?? "catalog",
      success,
      durationMs: Date.now() - started,
      billedUnits,
      projectId: options.projectId ?? null,
      metadata: options.metadata,
    });
  }
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

  const mime =
    resourceType === "video"
      ? "video/mp4"
      : filename.toLowerCase().endsWith(".jpg") ||
          filename.toLowerCase().endsWith(".jpeg")
        ? "image/jpeg"
        : "image/png";

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
