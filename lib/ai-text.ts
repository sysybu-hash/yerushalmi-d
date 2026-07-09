import type { AiResolvedProvider } from "@/lib/ai-engines";
import { geminiGenerateText, normalizeGeminiError } from "@/lib/studio-gemini";
import {
  extractText,
  hasHebrew,
  MODELS,
  replicate,
} from "@/lib/studio-replicate";
import { trackAiUsage } from "@/lib/ai-usage";
import type { AiUsageMode } from "@/lib/ai-usage";

type TextUsageContext = { mode?: AiUsageMode; projectId?: number | null };

export async function translatePrompt(
  text: string,
  engine: AiResolvedProvider,
  context: TextUsageContext = {}
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !hasHebrew(trimmed)) return trimmed;

  const prompt = `Translate the following Hebrew text to English for use as an AI image/video generation prompt. Output ONLY the English translation, nothing else:\n\n${trimmed}`;

  const started = Date.now();
  let success = false;
  try {
    if (engine === "gemini") {
      try {
        const translated = await geminiGenerateText(prompt, 0.1);
        success = true;
        return translated || trimmed;
      } catch (error) {
        throw new Error(
          normalizeGeminiError(error, "תרגום הפרומפט ב-Gemini נכשל")
        );
      }
    }

    const output = await replicate.run(MODELS.llama, {
      input: {
        prompt,
        max_tokens: 400,
        temperature: 0.1,
      },
    });

    const translated = extractText(output);
    success = true;
    return translated || trimmed;
  } finally {
    await trackAiUsage({
      provider: engine === "gemini" ? "gemini" : "replicate",
      capability: "text",
      modelId:
        engine === "gemini" ? "gemini-3.5-flash" : MODELS.llama,
      mode: context.mode ?? "catalog",
      success,
      durationMs: Date.now() - started,
      projectId: context.projectId ?? null,
      metadata: { task: "translate" },
    });
  }
}

export async function generateStructuredText(
  prompt: string,
  engine: AiResolvedProvider,
  temperature = 0.25,
  context: TextUsageContext = {}
): Promise<string> {
  const started = Date.now();
  let success = false;
  try {
    if (engine === "gemini") {
      try {
        const result = await geminiGenerateText(prompt, temperature);
        success = true;
        return result;
      } catch (error) {
        throw new Error(
          normalizeGeminiError(error, "יצירת הטקסט ב-Gemini נכשלה")
        );
      }
    }

    const output = await replicate.run(MODELS.llama, {
      input: {
        prompt,
        max_tokens: 600,
        temperature,
      },
    });

    const result = extractText(output);
    success = true;
    return result;
  } finally {
    await trackAiUsage({
      provider: engine === "gemini" ? "gemini" : "replicate",
      capability: "text",
      modelId:
        engine === "gemini" ? "gemini-3.5-flash" : MODELS.llama,
      mode: context.mode ?? "listing",
      success,
      durationMs: Date.now() - started,
      projectId: context.projectId ?? null,
      metadata: { task: "structured-text" },
    });
  }
}
