import { StudioBetaError, mapProviderError } from "@/lib/studio-beta/errors";

/**
 * קליינט Gemini REST חדש (fetch גולמי — אין SDK רשמי בפרויקט). מכסה שני
 * capabilities: עריכת/יצירת תמונה (Nano Banana) ווידאו (Veo, long-running
 * operation עם polling). צורת התגובה המדויקת מאומתת בפועל בשלב חיווט
 * המנועים האמיתיים (לא נוכל לוודא אותה בלי קריאה אמיתית) — כל פענוח כאן
 * זורק שגיאה ברורה במקום להחזיר תוצאה חלקית/שקטה בכשל.
 */

const GEMINI_IMAGE_MODELS = [
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-2.5-flash-image",
] as const;

const VEO_POLL_INTERVAL_MS = 5000;
const VEO_POLL_TIMEOUT_MS = 270_000;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new StudioBetaError(
      "PROVIDER_NOT_CONFIGURED",
      "GEMINI_API_KEY לא מוגדר — לא ניתן להשתמש במנועי Gemini/Veo"
    );
  }
  return key;
}

type GeminiErrorBody = { error?: { message?: string } };

async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const json = (await response
    .json()
    .catch(() => null)) as (T & GeminiErrorBody) | null;
  if (!response.ok) {
    const message = json?.error?.message ?? `HTTP ${response.status} מ-Gemini`;
    throw mapProviderError("Gemini", new Error(message));
  }
  return json as T;
}

type GeminiInlineData = {
  data?: string;
  mimeType?: string;
  mime_type?: string;
};

type GeminiContentPart = {
  inlineData?: GeminiInlineData;
  inline_data?: GeminiInlineData;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{ content?: { parts?: GeminiContentPart[] } }>;
};

type GeminiTextPart = { text?: string };

type GeminiGenerateTextResponse = {
  candidates?: Array<{ content?: { parts?: GeminiTextPart[] } }>;
};

type GeminiOperationStart = { name?: string };

type GeminiOperationStatus = {
  done?: boolean;
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{ video?: { uri?: string } }>;
    };
    videos?: Array<{ uri?: string }>;
  };
};

type ImageEditInput = {
  prompt: string;
  /** data URI מלא (data:image/png;base64,...) של תמונת הקלט, אם יש */
  imageDataUri?: string;
};

/** מחזיר data URI (base64) של תמונת התוצאה, עם נפילה בין 3 גרסאות המודל */
export async function generateOrEditImage(
  input: ImageEditInput
): Promise<{ dataUri: string; modelId: string }> {
  const apiKey = getApiKey();
  const parts: Record<string, unknown>[] = [{ text: input.prompt }];
  if (input.imageDataUri) {
    const [, mimeType, base64] =
      input.imageDataUri.match(/^data:([^;]+);base64,([\s\S]+)$/) ?? [];
    if (base64) {
      parts.push({ inlineData: { mimeType, data: base64 } });
    }
  }

  let lastError: unknown = null;
  for (const modelId of GEMINI_IMAGE_MODELS) {
    try {
      const json = await fetchJson<GeminiGenerateContentResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts }] }),
        }
      );

      const responseParts: GeminiContentPart[] =
        json?.candidates?.[0]?.content?.parts ?? [];
      const imagePart = responseParts.find(
        (part) => part.inlineData?.data || part.inline_data?.data
      );
      const inline = imagePart?.inlineData ?? imagePart?.inline_data;
      if (inline?.data) {
        const mime = inline.mimeType ?? inline.mime_type ?? "image/png";
        return { dataUri: `data:${mime};base64,${inline.data}`, modelId };
      }
      lastError = new Error(`תגובת Gemini (${modelId}) ללא תמונה`);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof StudioBetaError
    ? lastError
    : mapProviderError("Gemini", lastError);
}

const GEMINI_VISION_MODEL = "gemini-3.5-flash";

type ImageAnalyzeInput = {
  prompt: string;
  /** data URI מלא (data:image/png;base64,...) של תמונת הקלט */
  imageDataUri: string;
};

/** ניתוח תמונה — מחזיר טקסט תיאורי (לא תמונה), למשל זיהוי תכשיט */
export async function analyzeImage(
  input: ImageAnalyzeInput
): Promise<{ text: string; modelId: string }> {
  const apiKey = getApiKey();
  const [, mimeType, base64] =
    input.imageDataUri.match(/^data:([^;]+);base64,([\s\S]+)$/) ?? [];
  if (!base64) {
    throw new StudioBetaError("VALIDATION", "תמונת קלט לא תקינה לניתוח");
  }

  const json = await fetchJson<GeminiGenerateTextResponse>(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_VISION_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: input.prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
      }),
    }
  );

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new StudioBetaError(
      "PROVIDER_ERROR",
      `תגובת Gemini (${GEMINI_VISION_MODEL}) ללא טקסט`
    );
  }

  return { text, modelId: GEMINI_VISION_MODEL };
}

type VeoInput = {
  prompt: string;
  imageDataUri: string;
  durationSec: number;
  fast: boolean;
};

/** יצירת וידאו Veo (image-to-video) עם polling עד VEO_POLL_TIMEOUT_MS */
export async function generateVeoVideo(
  input: VeoInput
): Promise<{ videoUrl: string; modelId: string }> {
  const apiKey = getApiKey();
  const modelId = input.fast
    ? "veo-3.1-fast-generate-preview"
    : "veo-3.1-generate-preview";

  const [, mimeType, base64] =
    input.imageDataUri.match(/^data:([^;]+);base64,([\s\S]+)$/) ?? [];

  const startJson = await fetchJson<GeminiOperationStart>(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predictLongRunning?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [
          {
            prompt: input.prompt,
            image: { bytesBase64Encoded: base64, mimeType },
          },
        ],
        parameters: { durationSeconds: input.durationSec },
      }),
    }
  );

  const operationName: string | undefined = startJson?.name;
  if (!operationName) {
    throw new StudioBetaError(
      "PROVIDER_ERROR",
      "Veo לא החזיר מזהה תהליך (operation name)"
    );
  }

  const deadline = Date.now() + VEO_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, VEO_POLL_INTERVAL_MS));
    const statusJson = await fetchJson<GeminiOperationStatus>(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      { method: "GET" }
    );
    if (statusJson?.done) {
      const videoUri =
        statusJson?.response?.generateVideoResponse?.generatedSamples?.[0]
          ?.video?.uri ?? statusJson?.response?.videos?.[0]?.uri;
      if (!videoUri) {
        throw new StudioBetaError(
          "PROVIDER_ERROR",
          "Veo סיים אך לא החזיר קישור וידאו"
        );
      }
      return { videoUrl: `${videoUri}&key=${apiKey}`, modelId };
    }
  }

  throw new StudioBetaError(
    "PROVIDER_ERROR",
    "יצירת הוידאו ב-Veo לא הסתיימה בזמן — נסו שוב"
  );
}
