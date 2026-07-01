import type { AiEngineConfig } from "@/lib/ai-engines";
import { getResolvedAiEngines } from "@/lib/ai-engine-resolve";
import { generateStructuredText } from "@/lib/ai-text";
import { fetchImageDataUri } from "@/lib/vision-image";
import {
  collectReplicateText,
  MODELS,
  normalizeStudioError,
  runTrackedReplicate,
} from "@/lib/studio-replicate";
import { trackAiUsage } from "@/lib/ai-usage";
import {
  geminiAnalyzeImage,
  normalizeGeminiError,
} from "@/lib/studio-gemini";

const VALID_CATEGORIES = [
  "rings",
  "engagement-rings",
  "necklaces",
  "earrings",
  "bracelets",
  "diamonds",
  "custom",
] as const;

export type ListingAiCategory = (typeof VALID_CATEGORIES)[number];
export type ListingAiType = "natural" | "lab";

export type GeneratedListingContent = {
  title: string;
  description: string;
  category: ListingAiCategory;
  type: ListingAiType;
};

export type GenerateListingInput = {
  imageUrls: string[];
  assetTitles?: string[];
  existingTitle?: string;
  existingDescription?: string;
  mode: "fill" | "refine";
  engines?: Partial<AiEngineConfig>;
};

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("ה-AI לא החזיר תשובה בפורמט תקין — נסו שוב");
  }

  return JSON.parse(candidate.slice(start, end + 1)) as Record<string, unknown>;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: unknown): ListingAiCategory {
  const raw = asString(value).toLowerCase();
  if ((VALID_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as ListingAiCategory;
  }
  if (raw.includes("engagement") || raw.includes("אירוסין")) {
    return "engagement-rings";
  }
  if (raw.includes("necklace") || raw.includes("שרשרת")) return "necklaces";
  if (raw.includes("earring") || raw.includes("עגיל")) return "earrings";
  if (raw.includes("bracelet") || raw.includes("צמיד")) return "bracelets";
  if (raw.includes("ring") || raw.includes("טבעת")) return "rings";
  if (raw.includes("diamond") || raw.includes("יהלום")) return "diamonds";
  return "custom";
}

function normalizeType(value: unknown): ListingAiType {
  const raw = asString(value).toLowerCase();
  if (raw === "lab" || raw.includes("מעבדה")) return "lab";
  if (raw === "natural" || raw.includes("טבעי")) return "natural";
  return "natural";
}

function buildListingFromJson(json: Record<string, unknown>): GeneratedListingContent {
  const title = asString(json.title);
  const description = asString(json.description);

  if (!title) {
    throw new Error("ה-AI לא הצליח ליצור שם מוצר — נסו שוב");
  }

  return polishHebrewListing({
    title,
    description,
    category: normalizeCategory(json.category),
    type: normalizeType(json.type),
  });
}

const AWKWARD_HEBREW_PATTERNS = [
  /טיפולוג/i,
  /נופש מושלם/i,
  /הנופש/i,
  /טיפוס של/i,
  /משקף את ה/i,
  /בעל אופי ייחודי/i,
  /מתנה/i,
  /typology/i,
  /perfect vacation/i,
];

function hasAwkwardHebrewCopy(text: string): boolean {
  return AWKWARD_HEBREW_PATTERNS.some((pattern) => pattern.test(text));
}

/** תיקוני ניסוח נפוצים מהמודל */
function polishHebrewListing(
  content: GeneratedListingContent
): GeneratedListingContent {
  let { title, description } = content;

  title = title
    .replace(/\s+/g, " ")
    .replace(/יהלום יקרה\b/g, "יהלום יוקרתי")
    .replace(/ענק ויפה/g, "מרכזי מרשים")
    .trim();

  description = description
    .replace(/\s+/g, " ")
    .replace(/טיפולוגיה/g, "אופי")
    .replace(/הנופש המושלם/g, "המראה המושלם")
    .replace(/נופש מושלם/g, "מראה מושלם")
    .replace(/יהלום ענק ויפה/g, "יהלום מרכזי מרשים")
    .replace(/משקף את הטיפולוגיה של המתנה/g, "מעניק נוכחות יוקרתית")
    .replace(/העיצוב המודרני מעניק לה את האופי הייחודי/g, "העיצוב המודרני מעניק לה נוכחות ייחודית")
    .trim();

  return { ...content, title, description };
}

const HEBREW_COPY_RULES = `You are a native Israeli Hebrew copywriter for YERUSHALMI DIAMONDS — a luxury jewelry boutique in Jerusalem.

Writing rules (MANDATORY):
- Write fluent, natural Israeli Hebrew — as in a high-end jewelry catalog, NOT translated English.
- Title: 3–7 words, elegant product name (e.g. "שרשרת יהלום סוליטר בזהב לבן").
- Description: exactly 2 short sentences, 35–70 Hebrew words total.
- Mention only what is visible: jewelry type, metal, stone cut/setting, style.
- Tone: refined, warm, understated luxury. No hype clichés.
- NEVER use these words/phrases: טיפולוגיה, נופש, מתנה, משקף את ה, בעל אופי ייחודי, ענק ויפה, יקרה (use יוקרתי instead).
- Prefer: יוקרתי, עדין, זוהר, מבריק, מעוצב, קלאסי, מרשים, סוליטר, שיבוץ.

Good example:
{
  "title": "שרשרת יהלום סוליטר בזהב לבן",
  "description": "שרשרת עדינה מזהב לבן עם יהלום מרכזי בחיתוך עגול ושיבוץ ארבע עיניים. עיצוב מינימליסטי ויוקרתי שמתאים לכל אירוע — מהיומיום ועד ערב מיוחד.",
  "category": "necklaces",
  "type": "natural"
}`;

const JEWELRY_VISION_PROMPT = `What jewelry is shown in this product photo?
Answer in English with these details:
1) jewelry type (earrings, ring, necklace, bracelet, pendant, or other)
2) metal color and finish
3) gemstone type, cut shape, and setting style
4) overall design style
Be factual — describe only what is clearly visible.`;

const LLAVA_JSON_PROMPT = `You are a luxury jewelry expert. Describe ONLY what is visible.
Output ONLY valid JSON:
{
  "jewelryType": "earrings | ring | necklace | bracelet | pendant | other",
  "metal": "metal color and finish",
  "stones": "gemstone type, cut, setting",
  "style": "design style",
  "description": "2-3 sentence English description"
}`;

type JewelryVisualAnalysis = {
  description: string;
  jewelryType?: string;
  metal?: string;
  stones?: string;
  style?: string;
};

function inferJewelryTypeFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes("engagement ring")) return "engagement ring";
  if (lower.includes("earring") || lower.includes("stud earring")) return "earrings";
  if (lower.includes("necklace") || lower.includes("pendant")) return "necklace";
  if (lower.includes("bracelet") || lower.includes("bangle")) return "bracelet";
  if (lower.includes("ring")) return "ring";
  return undefined;
}

function inferAnalysisFromText(text: string): JewelryVisualAnalysis {
  const jewelryType = inferJewelryTypeFromText(text);
  return {
    description: text.trim(),
    jewelryType,
  };
}

function parseVisionAnalysis(text: string): JewelryVisualAnalysis | undefined {
  const trimmed = text.trim();
  if (trimmed.length < 8) return undefined;

  try {
    const json = parseJsonObject(trimmed);
    const description = asString(json.description);
    if (!description) return inferAnalysisFromText(trimmed);

    return {
      description,
      jewelryType: asString(json.jewelryType) || inferJewelryTypeFromText(trimmed),
      metal: asString(json.metal) || undefined,
      stones: asString(json.stones) || undefined,
      style: asString(json.style) || undefined,
    };
  } catch {
    return inferAnalysisFromText(trimmed);
  }
}

function formatVisualAnalysis(analysis: JewelryVisualAnalysis): string {
  const parts = [
    analysis.description,
    analysis.jewelryType ? `Type: ${analysis.jewelryType}` : "",
    analysis.metal ? `Metal: ${analysis.metal}` : "",
    analysis.stones ? `Stones: ${analysis.stones}` : "",
    analysis.style ? `Style: ${analysis.style}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

function categoryFromJewelryType(jewelryType?: string): ListingAiCategory | undefined {
  if (!jewelryType) return undefined;
  const raw = jewelryType.toLowerCase();
  if (raw.includes("engagement")) return "engagement-rings";
  if (raw.includes("earring") || raw.includes("stud")) return "earrings";
  if (raw.includes("necklace") || raw.includes("pendant")) return "necklaces";
  if (raw.includes("bracelet") || raw.includes("bangle")) return "bracelets";
  if (raw.includes("ring")) return "rings";
  if (raw.includes("diamond")) return "diamonds";
  return undefined;
}

async function runMoondream(imageInput: string): Promise<string> {
  const output = await runTrackedReplicate(
    MODELS.moondream,
    {
      image: imageInput,
      prompt: JEWELRY_VISION_PROMPT,
    },
    { capability: "vision", mode: "listing" }
  );

  const text = await collectReplicateText(output);
  if (!text) {
    throw new Error("מודל הראייה לא החזיר תיאור");
  }

  return text;
}

async function runLlava(imageInput: string): Promise<string> {
  const output = await runTrackedReplicate(
    MODELS.llava,
    {
      image: imageInput,
      prompt: LLAVA_JSON_PROMPT,
      max_tokens: 500,
      temperature: 0.1,
    },
    { capability: "vision", mode: "listing" }
  );

  const text = await collectReplicateText(output);
  if (!text) {
    throw new Error("מודל הראייה לא החזיר תיאור");
  }

  return text;
}

async function runGeminiVision(imageUrl: string): Promise<string> {
  const imageInput = await fetchImageDataUri(imageUrl);
  const started = Date.now();
  let success = false;
  try {
    const text = await geminiAnalyzeImage(imageInput, JEWELRY_VISION_PROMPT);
    success = true;
    return text;
  } catch (error) {
    throw new Error(
      normalizeGeminiError(error, "ניתוח התמונה ב-Gemini נכשל")
    );
  } finally {
    await trackAiUsage({
      provider: "gemini",
      capability: "vision",
      modelId: "gemini-3.5-flash",
      mode: "listing",
      success,
      durationMs: Date.now() - started,
    });
  }
}

async function analyzeJewelryImage(
  imageUrl: string,
  visionEngine: "replicate" | "gemini"
): Promise<JewelryVisualAnalysis> {
  const imageInput = await fetchImageDataUri(imageUrl);
  const runners =
    visionEngine === "gemini"
      ? [{ label: "Gemini", fn: () => runGeminiVision(imageUrl) }]
      : [
          { label: "Moondream", fn: () => runMoondream(imageInput) },
          { label: "LLaVA", fn: () => runLlava(imageInput) },
        ];

  const errors: string[] = [];

  for (const run of runners) {
    try {
      const raw = await run.fn();
      const parsed = parseVisionAnalysis(raw);
      if (parsed?.description) {
        return parsed;
      }
      errors.push(`${run.label}: תשובה ריקה`);
    } catch (error) {
      errors.push(
        `${run.label}: ${normalizeStudioError(error, "שגיאה לא ידועה")}`
      );
    }
  }

  throw new Error(
    errors.length > 0
      ? `ניתוח התמונה נכשל — ${errors.join(" | ")}`
      : "לא הצלחנו לנתח את התמונה"
  );
}

async function analyzeJewelryImages(
  imageUrls: string[],
  visionEngine: "replicate" | "gemini"
): Promise<JewelryVisualAnalysis> {
  const errors: string[] = [];

  for (const imageUrl of imageUrls) {
    try {
      return await analyzeJewelryImage(imageUrl, visionEngine);
    } catch (error) {
      errors.push(normalizeStudioError(error, "שגיאה לא ידועה"));
    }
  }

  throw new Error(
    errors.length > 0
      ? `לא הצלחנו לנתח את התמונה — ${errors[errors.length - 1]}`
      : "לא הצלחנו לנתח את התמונה — נסו שוב או הוסיפו שם לנכס"
  );
}

async function generateListingText(input: {
  visualAnalysis?: JewelryVisualAnalysis;
  assetTitles?: string[];
  existingTitle?: string;
  existingDescription?: string;
  mode: "fill" | "refine";
  textEngine: "replicate" | "gemini";
}): Promise<GeneratedListingContent> {
  const titleHints =
    input.assetTitles?.filter(Boolean).join(", ") || "אין";
  const visual = input.visualAnalysis
    ? formatVisualAnalysis(input.visualAnalysis)
    : "אין תיאור ויזואלי";
  const detectedCategory = categoryFromJewelryType(input.visualAnalysis?.jewelryType);
  const currentTitle = input.existingTitle?.trim() || "";
  const currentDescription = input.existingDescription?.trim() || "";

  const taskPrompt =
    input.mode === "refine"
      ? `Rewrite and improve the existing Hebrew listing. Fix awkward or translated phrasing. Keep the same product facts. Make it sound like premium Israeli jewelry copy.`
      : `Create a new Hebrew product listing from the visual analysis.`;

  const prompt = `${HEBREW_COPY_RULES}

Task: ${taskPrompt}

Visual analysis (English): ${visual}
Asset title hints: ${titleHints}
Current title (Hebrew): ${currentTitle || "ריק"}
Current description (Hebrew): ${currentDescription || "ריק"}

Output ONLY valid JSON, no markdown, no explanation:
{
  "title": "...",
  "description": "...",
  "category": "one of: rings, engagement-rings, necklaces, earrings, bracelets, diamonds, custom",
  "type": "natural or lab"
}`;

  const text = await generateStructuredText(
    prompt,
    input.textEngine,
    input.mode === "refine" ? 0.2 : 0.3
  );
  const result = buildListingFromJson(parseJsonObject(text));

  if (detectedCategory && input.mode === "fill") {
    result.category = detectedCategory;
  }

  if (
    hasAwkwardHebrewCopy(`${result.title} ${result.description}`)
  ) {
    const retryText = await generateStructuredText(
      `${HEBREW_COPY_RULES}

The previous Hebrew draft was awkward. Rewrite it completely in natural Israeli Hebrew.

Previous title: ${result.title}
Previous description: ${result.description}
Visual analysis: ${visual}

Output ONLY valid JSON with improved natural Hebrew.`,
      input.textEngine,
      0.15
    );
    return buildListingFromJson(parseJsonObject(retryText));
  }

  return result;
}

export async function generateListingContent(
  input: GenerateListingInput
): Promise<GeneratedListingContent> {
  try {
    const engines = await getResolvedAiEngines(input.engines);

    if (input.mode === "refine") {
      if (!input.existingTitle?.trim() && !input.existingDescription?.trim()) {
        throw new Error("יש להזין שם או תיאור לפני שיפור התוכן");
      }

      let visualAnalysis: JewelryVisualAnalysis | undefined;
      if (input.imageUrls.length > 0) {
        try {
          visualAnalysis = await analyzeJewelryImages(
            input.imageUrls,
            engines.vision
          );
        } catch {
          visualAnalysis = undefined;
        }
      }

      return generateListingText({
        visualAnalysis,
        assetTitles: input.assetTitles,
        existingTitle: input.existingTitle,
        existingDescription: input.existingDescription,
        mode: "refine",
        textEngine: engines.text,
      });
    }

    const coverImage = input.imageUrls[0];
    if (!coverImage) {
      throw new Error("נדרשת לפחות תמונת מוצר אחת למילוי אוטומטי");
    }

    const visualAnalysis = await analyzeJewelryImages(
      input.imageUrls,
      engines.vision
    );

    return generateListingText({
      visualAnalysis,
      assetTitles: input.assetTitles,
      existingTitle: input.existingTitle,
      existingDescription: input.existingDescription,
      mode: "fill",
      textEngine: engines.text,
    });
  } catch (error) {
    throw new Error(
      normalizeStudioError(error, "יצירת התוכן ב-AI נכשלה — נסו שוב")
    );
  }
}
