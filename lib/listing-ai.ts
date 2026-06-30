import {
  extractText,
  MODELS,
  normalizeStudioError,
  replicate,
} from "@/lib/studio-replicate";

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

async function analyzeJewelryImage(imageUrl: string): Promise<string | undefined> {
  try {
    const output = await replicate.run(MODELS.llava, {
      input: {
        image: imageUrl,
        prompt:
          "You are a luxury jewelry expert. Describe ONLY what is visible in this product photo: jewelry type (ring, necklace, earrings, bracelet), metal color/finish, diamond or gemstone cut and setting, chain or band style, and overall design aesthetic. Be factual and specific. English only, 2-4 sentences.",
        max_tokens: 400,
        temperature: 0.2,
      },
    });

    const description = extractText(output);
    return description || undefined;
  } catch {
    return undefined;
  }
}

async function generateListingText(input: {
  visualDescription?: string;
  assetTitles?: string[];
  existingTitle?: string;
  existingDescription?: string;
  mode: "fill" | "refine";
}): Promise<GeneratedListingContent> {
  const titleHints =
    input.assetTitles?.filter(Boolean).join(", ") || "אין";
  const visual = input.visualDescription?.trim() || "אין תיאור ויזואלי";
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

  const output = await replicate.run(MODELS.llama, {
    input: {
      prompt,
      max_tokens: 600,
      temperature: input.mode === "refine" ? 0.2 : 0.3,
    },
  });

  const text = extractText(output);
  const result = buildListingFromJson(parseJsonObject(text));

  if (
    hasAwkwardHebrewCopy(`${result.title} ${result.description}`)
  ) {
    const retryOutput = await replicate.run(MODELS.llama, {
      input: {
        prompt: `${HEBREW_COPY_RULES}

The previous Hebrew draft was awkward. Rewrite it completely in natural Israeli Hebrew.

Previous title: ${result.title}
Previous description: ${result.description}
Visual analysis: ${visual}

Output ONLY valid JSON with improved natural Hebrew.`,
        max_tokens: 600,
        temperature: 0.15,
      },
    });
    return buildListingFromJson(parseJsonObject(extractText(retryOutput)));
  }

  return result;
}

export async function generateListingContent(
  input: GenerateListingInput
): Promise<GeneratedListingContent> {
  try {
    if (input.mode === "refine") {
      if (!input.existingTitle?.trim() && !input.existingDescription?.trim()) {
        throw new Error("יש להזין שם או תיאור לפני שיפור התוכן");
      }

      let visualDescription: string | undefined;
      const coverImage = input.imageUrls[0];
      if (coverImage) {
        visualDescription = await analyzeJewelryImage(coverImage);
      }

      return generateListingText({
        visualDescription,
        assetTitles: input.assetTitles,
        existingTitle: input.existingTitle,
        existingDescription: input.existingDescription,
        mode: "refine",
      });
    }

    const coverImage = input.imageUrls[0];
    if (!coverImage) {
      throw new Error("נדרשת לפחות תמונת מוצר אחת למילוי אוטומטי");
    }

    const visualDescription = await analyzeJewelryImage(coverImage);
    if (!visualDescription && !input.assetTitles?.length && !input.existingTitle?.trim()) {
      throw new Error("לא הצלחנו לנתח את התמונה — נסו שוב או הוסיפו שם לנכס");
    }

    return generateListingText({
      visualDescription,
      assetTitles: input.assetTitles,
      existingTitle: input.existingTitle,
      existingDescription: input.existingDescription,
      mode: "fill",
    });
  } catch (error) {
    throw new Error(
      normalizeStudioError(error, "יצירת התוכן ב-AI נכשלה — נסו שוב")
    );
  }
}
