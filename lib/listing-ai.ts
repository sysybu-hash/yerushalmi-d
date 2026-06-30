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

  return {
    title,
    description,
    category: normalizeCategory(json.category),
    type: normalizeType(json.type),
  };
}

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
      ? `Improve and polish the existing Hebrew product listing for YERUSHALMI DIAMONDS luxury jewelry store.
Keep the same product meaning but make the title more elegant and the description more compelling for e-commerce.
If category/type can be inferred better from the content, update them.`
      : `Create a new Hebrew product listing for YERUSHALMI DIAMONDS luxury jewelry e-commerce store.
Write elegant, premium marketing copy in Hebrew suitable for a product page.`;

  const output = await replicate.run(MODELS.llama, {
    input: {
      prompt: `${taskPrompt}

Visual analysis (English): ${visual}
Asset title hints: ${titleHints}
Current title (Hebrew): ${currentTitle || "ריק"}
Current description (Hebrew): ${currentDescription || "ריק"}

Output ONLY valid JSON, no markdown, no extra text:
{
  "title": "short elegant Hebrew product name, max 60 characters",
  "description": "2-3 sentences luxury Hebrew marketing description for the product page",
  "category": "one of: rings, engagement-rings, necklaces, earrings, bracelets, diamonds, custom",
  "type": "natural or lab — default natural unless clearly lab-grown"
}`,
      max_tokens: 700,
      temperature: input.mode === "refine" ? 0.35 : 0.55,
    },
  });

  const text = extractText(output);
  return buildListingFromJson(parseJsonObject(text));
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
