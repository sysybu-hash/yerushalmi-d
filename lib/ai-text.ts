import type { AiResolvedProvider } from "@/lib/ai-engines";
import { geminiGenerateText, normalizeGeminiError } from "@/lib/studio-gemini";
import {
  extractText,
  hasHebrew,
  MODELS,
  replicate,
} from "@/lib/studio-replicate";

export async function translatePrompt(
  text: string,
  engine: AiResolvedProvider
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || !hasHebrew(trimmed)) return trimmed;

  const prompt = `Translate the following Hebrew text to English for use as an AI image/video generation prompt. Output ONLY the English translation, nothing else:\n\n${trimmed}`;

  if (engine === "gemini") {
    try {
      const translated = await geminiGenerateText(prompt, 0.1);
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
  return translated || trimmed;
}

export async function generateStructuredText(
  prompt: string,
  engine: AiResolvedProvider,
  temperature = 0.25
): Promise<string> {
  if (engine === "gemini") {
    try {
      return await geminiGenerateText(prompt, temperature);
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

  return extractText(output);
}
