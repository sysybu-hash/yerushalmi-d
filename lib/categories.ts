import type { SiteSettings } from "@/lib/site-settings";
import { COLLECTION_SETTING_KEYS } from "@/lib/site-settings";

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

/** ברירות מחדל — fallback אם אין settings */
export const COLLECTION_LABELS: Record<CollectionSlug, string> = {
  rings: "טבעות",
  "engagement-rings": "טבעות אירוסין",
  bracelets: "צמידים",
  necklaces: "תליונים ושרשראות",
  earrings: "עגילים",
  diamonds: "יהלומים",
  custom: "עיצוב אישי",
};

export function isCollectionSlug(slug: string): slug is CollectionSlug {
  return (COLLECTION_SLUGS as readonly string[]).includes(slug);
}

/** שם קולקציה — מהגדרות האתר עם fallback */
export function collectionLabel(
  slug: string,
  settings?: SiteSettings
): string {
  if (settings) {
    const entry = COLLECTION_SETTING_KEYS.find((c) => c.slug === slug);
    if (entry) {
      return settings[entry.titleKey] || COLLECTION_LABELS[slug as CollectionSlug];
    }
  }
  return COLLECTION_LABELS[slug as CollectionSlug] ?? slug;
}

/** תמונת באנר לעמוד קולקציה — מיפוי 1:1 מהגדרות */
export function getCategoryBannerImage(
  slug: string,
  settings: SiteSettings
): string {
  const entry = COLLECTION_SETTING_KEYS.find((c) => c.slug === slug);
  if (!entry) return "";
  return settings[entry.imageKey] ?? "";
}

/** ארבע הקטegוריות המוצגות בדף הבית (כרטיסים) */
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

/** קטegוריות לקטalog בדף הבית — 2 מוצרים לכל קטegoria */
export const STOREFRONT_CATALOG_SLUGS = [
  "engagement-rings",
  "rings",
  "bracelets",
  "necklaces",
  "earrings",
  "diamonds",
] as const satisfies readonly CollectionSlug[];

/** קישורי ניווט — שמות מהגדרות כשזמין */
export function storeNavLinks(settings: SiteSettings) {
  return [
    { label: "דף הבית", href: "/" },
    {
      label: settings.categoryEngagementRingsTitle,
      href: "/collections/engagement-rings",
    },
    { label: settings.categoryRingsTitle, href: "/collections/rings" },
    { label: settings.categoryNecklacesTitle, href: "/collections/necklaces" },
    { label: settings.categoryEarringsTitle, href: "/collections/earrings" },
    { label: settings.categoryBraceletsTitle, href: "/collections/bracelets" },
    { label: settings.categoryDiamondsTitle, href: "/collections/diamonds" },
    { label: settings.categoryCustomTitle, href: "/collections/custom" },
    { label: "צור קשר", href: "/contact" },
  ] as const;
}

/** @deprecated השתמשו ב-storeNavLinks(settings) */
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
