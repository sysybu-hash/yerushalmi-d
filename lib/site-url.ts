/**
 * כתובת הבסיס של האתר — לשימוש ב-metadata, sitemap, robots ו-JSON-LD.
 * ניתן להגדרה דרך NEXT_PUBLIC_SITE_URL; אחרת נופל לכתובת Vercel או ברירת מחדל.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "https://yerushalmi-diamonds.co.il";
}
