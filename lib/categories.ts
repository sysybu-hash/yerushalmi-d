import type { SiteSettings } from "@/lib/site-settings";

/** כל slug-ים תקינים של קולקציות בחנות */
export const COLLECTION_SLUGS = [
  "rings",
  "engagement-rings",
  "bracelets",
  "necklaces",
  "earrings",
  "diamonds",
  "custom",
] as const;

export type CollectionSlug = (typeof COLLECTION_SLUGS)[number];

export const COLLECTION_LABELS: Record<CollectionSlug, string> = {
  rings: "טבעות",
  "engagement-rings": "טבעות אירוסין",
  bracelets: "צמידים",
  necklaces: "תליונים ושרשראות",
  earrings: "עגילים",
  diamonds: "יהלומים",
  custom: "עיצוב אישי",
};

export const STORE_NAV_LINKS = [
  { label: "דף הבית", href: "/" },
  { label: "טבעות אירוסין", href: "/collections/engagement-rings" },
  { label: "טבעות", href: "/collections/rings" },
  { label: "תליונים ושרשראות", href: "/collections/necklaces" },
  { label: "עגילים", href: "/collections/earrings" },
  { label: "צמידים", href: "/collections/bracelets" },
  { label: "יהלומים", href: "/collections/diamonds" },
  { label: "עיצוב אישי", href: "/collections/custom" },
  { label: "צור קשר", href: "/contact" },
] as const;

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return (COLLECTION_SLUGS as readonly string[]).includes(slug);
}

export function collectionLabel(slug: string) {
  return COLLECTION_LABELS[slug as CollectionSlug] ?? slug;
}

/** תמונת באנר לעמוד קולקציה — ממופה מהגדרות האתר */
export function getCategoryBannerImage(
  slug: string,
  settings: SiteSettings
): string {
  const map: Record<string, string> = {
    rings: settings.categoryRingsImage,
    "engagement-rings": settings.categoryRingsImage,
    bracelets: settings.categoryBraceletsImage,
    necklaces: settings.categoryNecklacesImage,
    earrings: settings.categoryNecklacesImage,
    diamonds: settings.categoryRingsImage,
    custom: settings.categoryCustomImage,
  };
  return map[slug] ?? "";
}

/** ארבע הקטגוריות המוצגות בדף הבית */
export function homepageCategories(settings: SiteSettings) {
  return [
    {
      name: settings.categoryRingsTitle,
      image: settings.categoryRingsImage,
      href: "/collections/rings",
    },
    {
      name: settings.categoryBraceletsTitle,
      image: settings.categoryBraceletsImage,
      href: "/collections/bracelets",
    },
    {
      name: settings.categoryNecklacesTitle,
      image: settings.categoryNecklacesImage,
      href: "/collections/necklaces",
    },
    {
      name: settings.categoryCustomTitle,
      image: settings.categoryCustomImage,
      href: "/collections/custom",
    },
  ];
}
