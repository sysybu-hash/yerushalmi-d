const GEMINI_MODEL = "gemini-2.0-flash";

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY חסר — הוסיפו מפתח Google AI ב-Vercel");
  }
  return key;
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const candidates = (payload as { candidates?: unknown[] }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const parts = (
    candidates[0] as { content?: { parts?: { text?: string }[] } }
  ).content?.parts;

  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

export function normalizeGeminiError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) {
      if (/API key not valid|invalid api key/i.test(message)) {
        return "מפתח Gemini לא תקין — בדקו את GEMINI_API_KEY ב-Vercel";
      }
      if (/429|quota|rate limit/i.test(message)) {
        return "חריגה ממכסת Gemini — נסו שוב מאוחר יותר או בחרו Replicate";
      }
      return message;
    }
  }
  return fallback;
}

async function geminiGenerate(parts: GeminiPart[], temperature = 0.2): Promise<string> {
  const key = getGeminiApiKey();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature,
          maxOutputTokens: 1200,
        },
      }),
      signal: AbortSignal.timeout(60_000),
    }
  );

  const json = (await response.json()) as {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `שגיאת Gemini (${response.status})`);
  }

  const text = extractGeminiText(json);
  if (!text) {
    throw new Error("Gemini לא החזיר תשובה");
  }

  return text;
}

export async function geminiGenerateText(
  prompt: string,
  temperature = 0.25
): Promise<string> {
  return geminiGenerate([{ text: prompt }], temperature);
}

export async function geminiAnalyzeImage(
  imageDataUri: string,
  prompt: string
): Promise<string> {
  const match = imageDataUri.match(/^data:(.*?);base64,(.+)$/);
  if (!match) {
    throw new Error("פורמט תמונה לא תקין לניתוח Gemini");
  }

  return geminiGenerate([
    {
      inline_data: {
        mime_type: match[1] || "image/jpeg",
        data: match[2],
      },
    },
    { text: prompt },
  ]);
}
