/**
 * ספריית רקעים מוכנים — 12 תמונות רקע אמיתיות שנוצרו פעם אחת ב-Gemini
 * (לא SVG פרוצדורלי) ונשמרו כקבצים קבועים ב-Cloudinary. המנוע החינמי
 * (procedural) קורא מכאן במקום ליצור רקע חדש בכל בקשה — אפס עלות AI
 * בזמן ריצה. נוצר ע"י scripts/generate-studio-backgrounds.mjs.
 */

export const BACKGROUND_LIBRARY_IMAGES: Record<string, string> = {
  "white-studio":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948657/studio-beta-bg-library-white-studio-1783948656-5pkn4q.jpg",
  "luxury-marble":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948668/studio-beta-bg-library-luxury-marble-1783948667-fbi81o.jpg",
  "black-velvet":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948681/studio-beta-bg-library-black-velvet-1783948680-e9ngn8.jpg",
  "gold-bokeh":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948691/studio-beta-bg-library-gold-bokeh-1783948690-qkfpsi.jpg",
  "champagne-silk":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948702/studio-beta-bg-library-champagne-silk-1783948701-90k4qj.jpg",
  lifestyle:
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948713/studio-beta-bg-library-lifestyle-1783948712-d6bdui.jpg",
  "midnight-blue":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948724/studio-beta-bg-library-midnight-blue-1783948723-dcrrly.jpg",
  "rose-gold-glow":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948736/studio-beta-bg-library-rose-gold-glow-1783948735-1mo3ys.jpg",
  "jerusalem-stone":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948746/studio-beta-bg-library-jerusalem-stone-1783948745-564aqt.jpg",
  "concrete-minimal":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948757/studio-beta-bg-library-concrete-minimal-1783948756-cd1z8r.jpg",
  "mirror-glass":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948768/studio-beta-bg-library-mirror-glass-1783948767-osjvmd.jpg",
  "botanical-soft":
    "https://res.cloudinary.com/djohcg6ig/image/upload/v1783948780/studio-beta-bg-library-botanical-soft-1783948779-mvjb1g.jpg",
};

export function getLibraryBackgroundUrl(presetId?: string | null): string | null {
  if (!presetId) return null;
  return BACKGROUND_LIBRARY_IMAGES[presetId] ?? null;
}
