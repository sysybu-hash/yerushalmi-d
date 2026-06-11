export const CATEGORY_LABELS: Record<string, string> = {
  rings: "טבעות",
  "engagement-rings": "טבעות אירוסין",
  bracelets: "צמידים",
  necklaces: "תליונים ושרשראות",
  earrings: "עגילים",
  diamonds: "יהלומים",
  custom: "עיצוב אישי",
};

export const TYPE_LABELS: Record<string, string> = {
  natural: "יהלום טבעי",
  lab: "יהלום מעבדה",
};

export function categoryLabel(slug: string) {
  return CATEGORY_LABELS[slug] ?? slug;
}
