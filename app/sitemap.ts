import type { MetadataRoute } from "next";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import { COLLECTION_SLUGS } from "@/lib/categories";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/contact",
    "/privacy",
    "/terms",
    "/accessibility",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.5,
  }));

  const collectionRoutes: MetadataRoute.Sitemap = COLLECTION_SLUGS.map(
    (slug) => ({
      url: `${base}/collections/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    })
  );

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const rows = await db
      .select({ id: products.id, createdAt: products.createdAt })
      .from(products)
      .orderBy(desc(products.createdAt));

    productRoutes = rows.map((row) => ({
      url: `${base}/products/${row.id}`,
      lastModified: row.createdAt ?? now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    // ללא DB (למשל בזמן בנייה) — נחזיר את הנתיבים הסטטיים בלבד
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
