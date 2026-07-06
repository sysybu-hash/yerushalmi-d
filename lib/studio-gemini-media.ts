import { fetchImageDataUri } from "@/lib/vision-image";
import { opaqueImageUrlForVideo } from "@/lib/cloudinary-url";
import { normalizeGeminiError } from "@/lib/studio-gemini";
import {
  DEFAULT_VIDEO_NEGATIVE_PROMPT,
  JEWELRY_STRUCTURE_LOCK,
} from "@/lib/studio-presets";
import {
  mapDurationForVeo,
  parseStudioVideoDuration,
  type StudioVideoDurationSec,
} from "@/lib/studio-video-duration";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Nano Banana 2 (GA) → preview → Nano Banana 1 (גיבוי) */
const GEMINI_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-2.5-flash-image",
] as const;

const VEO_MODELS = [
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview",
] as const;

type GeminiMediaPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY חסר — הוסיפו מפתח Google AI ב-Vercel");
  }
  return key;
}

function parseDataUri(dataUri: string): { mimeType: string; data: string } {
  const match = dataUri.match(/^data:(.*?);base64,(.+)$/);
  if (!match) {
    throw new Error("פורמט תמונה לא תקין");
  }
  return { mimeType: match[1] || "image/jpeg", data: match[2] };
}

function extractGeminiImageBuffer(payload: unknown): Buffer | null {
  if (!payload || typeof payload !== "object") return null;

  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  const parts = (
    candidates[0] as {
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mime_type?: string };
        }>;
      };
    }
  ).content?.parts;

  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    const inline = part.inlineData ?? part.inline_data;
    const data = inline?.data;
    if (data) {
      return Buffer.from(data, "base64");
    }
  }

  return null;
}

function isRetirableGeminiModelError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /no longer available|has been shut down|not found|404/i.test(
    error.message
  );
}

async function geminiGenerateImageBuffer(
  parts: GeminiMediaPart[],
  options?: { aspectRatio?: string }
): Promise<Buffer> {
  const key = getGeminiApiKey();
  let lastError: Error | null = null;

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
              imageConfig: options?.aspectRatio
                ? { aspectRatio: options.aspectRatio }
                : { aspectRatio: "1:1" },
            },
          }),
          signal: AbortSignal.timeout(120_000),
        }
      );

      const json = (await response.json()) as {
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(json.error?.message ?? `שגיאת Gemini Image (${response.status})`);
      }

      const buffer = extractGeminiImageBuffer(json);
      if (!buffer || buffer.length < 512) {
        throw new Error("Gemini לא החזיר תמונה");
      }

      return buffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isRetirableGeminiModelError(error)) continue;
      throw new Error(
        normalizeGeminiError(error, "יצירת התמונה ב-Gemini נכשלה")
      );
    }
  }

  throw (
    lastError ??
    new Error("אין מודל תמונה זמין ב-Gemini — נסו Replicate או אוטומטי")
  );
}

export type SourceEnhancePreset = "complete" | "cleanup" | "enhance";

const SOURCE_ENHANCE_PROMPTS: Record<SourceEnhancePreset, string> = {
  complete: [
    "Edit this jewelry product photo.",
    "Extend naturally any cropped necklace chain, bracelet, or earring hook.",
    "Fill missing edges with seamless continuation — same metal color and link style.",
    "Keep the exact same jewelry piece: same diamonds, prongs, proportions, and design.",
    "Professional e-commerce product photo, sharp focus, studio lighting.",
    "Do not invent new jewelry or change the product.",
  ].join(" "),
  cleanup: [
    "Clean up this jewelry product photo for e-commerce.",
    "Place on a seamless pure white background (#FFFFFF).",
    "Remove clutter, shadows on backdrop, and color casts.",
    "Keep the exact same jewelry — same stones, metal, and proportions.",
    "Sharp macro detail, neutral studio lighting.",
    "Do not alter the jewelry design.",
  ].join(" "),
  enhance: [
    "Enhance this jewelry product photo for a luxury catalog.",
    "Improve sharpness, exposure, and micro-contrast on the metal and stones.",
    "Keep composition and jewelry design identical — no redesign.",
    "Natural studio lighting, photorealistic, high resolution.",
  ].join(" "),
};

export async function geminiEnhanceSourceImage(
  imageDataUri: string,
  options: {
    preset: SourceEnhancePreset;
    customPrompt?: string;
  }
): Promise<Buffer> {
  const { mimeType, data } = parseDataUri(imageDataUri);
  const basePrompt = SOURCE_ENHANCE_PROMPTS[options.preset];
  const extra = options.customPrompt?.trim();

  return geminiGenerateImageBuffer(
    [
      {
        inline_data: { mime_type: mimeType, data },
      },
      {
        text: extra ? `${basePrompt} Additional instructions: ${extra}` : basePrompt,
      },
    ],
    { aspectRatio: "1:1" }
  );
}

export async function geminiRemoveBackground(imageDataUri: string): Promise<Buffer> {
  const { mimeType, data } = parseDataUri(imageDataUri);

  return geminiGenerateImageBuffer([
    {
      inline_data: { mime_type: mimeType, data },
    },
    {
      text: [
        "Remove the background from this jewelry product photo.",
        "Output ONLY the jewelry isolated on a fully transparent background.",
        "Preserve every diamond, prong, metal edge, and reflection.",
        "Professional e-commerce cutout, PNG with alpha channel.",
        "Do not add new jewelry or change the product.",
      ].join(" "),
    },
  ]);
}

export async function geminiGenerateLuxuryBackground(prompt: string): Promise<Buffer> {
  return geminiGenerateImageBuffer([
    {
      text: [
        "Professional luxury jewelry product photography background.",
        "Empty scene — NO jewelry, NO hands, NO people, NO text, NO watermark.",
        "Photorealistic, high-end catalog, square composition.",
        prompt,
      ].join(" "),
    },
  ]);
}

function mapVeoResolution(
  mode: "standard" | "pro",
  duration: 4 | 6 | 8
): "720p" | "1080p" {
  if (mode === "pro" && duration === 8) return "1080p";
  return "720p";
}

async function pollVeoOperation(operationName: string): Promise<string> {
  const key = getGeminiApiKey();
  const deadline = Date.now() + 270_000;

  while (Date.now() < deadline) {
    const response = await fetch(`${GEMINI_API_BASE}/${operationName}`, {
      headers: { "x-goog-api-key": key },
      signal: AbortSignal.timeout(30_000),
    });

    const json = (await response.json()) as {
      done?: boolean;
      error?: { message?: string };
      response?: {
        generateVideoResponse?: {
          generatedSamples?: Array<{ video?: { uri?: string } }>;
        };
      };
    };

    if (!response.ok) {
      throw new Error(json.error?.message ?? `שגיאת Veo (${response.status})`);
    }

    if (json.error?.message) {
      throw new Error(json.error.message);
    }

    if (json.done) {
      const uri =
        json.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!uri) {
        throw new Error("Veo לא החזיר קישור לווידאו");
      }
      return uri;
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  throw new Error("יצירת הווידאו ב-Veo ארכה יותר מדי — נסו שוב");
}

export async function geminiGenerateVideoFromImage(options: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  duration?: StudioVideoDurationSec | 5 | 10;
  mode?: "standard" | "pro";
}): Promise<Buffer> {
  const fetchUrl = options.imageUrl.includes("res.cloudinary.com")
    ? opaqueImageUrlForVideo(options.imageUrl)
    : options.imageUrl;
  const imageDataUri = await fetchImageDataUri(fetchUrl);
  const { mimeType, data } = parseDataUri(imageDataUri);
  const durationSeconds = mapDurationForVeo(
    parseStudioVideoDuration(options.duration ?? 5)
  );
  const resolution = mapVeoResolution(options.mode ?? "pro", durationSeconds);

  const prompt = [
    JEWELRY_STRUCTURE_LOCK,
    options.prompt,
    options.negativePrompt
      ? `Avoid: ${options.negativePrompt}`
      : `Avoid: ${DEFAULT_VIDEO_NEGATIVE_PROMPT}`,
    "Static locked camera. Jewelry product frozen in place — only micro light sparkle on existing facets, no geometry change. No speech, no dialogue, no vocals.",
  ]
    .filter(Boolean)
    .join(" ");

  const key = getGeminiApiKey();
  let lastError: Error | null = null;

  for (const model of VEO_MODELS) {
    try {
      const startResponse = await fetch(
        `${GEMINI_API_BASE}/models/${model}:predictLongRunning?key=${encodeURIComponent(key)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [
              {
                prompt,
                image: {
                  bytesBase64Encoded: data,
                  mimeType,
                },
              },
            ],
            parameters: {
              aspectRatio: "16:9",
              durationSeconds,
              resolution,
            },
          }),
          signal: AbortSignal.timeout(60_000),
        }
      );

      const startJson = (await startResponse.json()) as {
        name?: string;
        error?: { message?: string };
      };

      if (!startResponse.ok || !startJson.name) {
        throw new Error(
          startJson.error?.message ?? `שגיאת Veo (${startResponse.status})`
        );
      }

      const videoUri = await pollVeoOperation(startJson.name);
      const videoResponse = await fetch(videoUri, {
        headers: { "x-goog-api-key": key },
        redirect: "follow",
        signal: AbortSignal.timeout(120_000),
      });

      if (!videoResponse.ok) {
        throw new Error(`הורדת הווידאו מ-Veo נכשלה (${videoResponse.status})`);
      }

      const buffer = Buffer.from(await videoResponse.arrayBuffer());
      if (buffer.length < 1024) {
        throw new Error("קובץ הווידאו מ-Veo ריק או פגום");
      }

      return buffer;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isRetirableGeminiModelError(error)) continue;
      throw new Error(
        normalizeGeminiError(error, "יצירת הווידאו ב-Gemini Veo נכשלה")
      );
    }
  }

  throw (
    lastError ??
    new Error("Veo לא זמין — ודאו ש-GEMINI_API_KEY כולל גישה ל-Veo (paid preview)")
  );
}
