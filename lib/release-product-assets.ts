import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { aiMediaAssets, products } from "@/db/schema";
import { collectProductMediaUrls } from "@/lib/product-media";

/** מחזיר נכסי ספרייה לטיוטה כשמוצר נמחק מהאתר */
export async function releaseAssetsForProduct(productId: number) {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  await db
    .update(aiMediaAssets)
    .set({ status: "draft", publishedProductId: null })
    .where(eq(aiMediaAssets.publishedProductId, productId));

  if (!product) return;

  const urls = collectProductMediaUrls(product);
  if (urls.length === 0) return;

  await db
    .update(aiMediaAssets)
    .set({ status: "draft", publishedProductId: null })
    .where(inArray(aiMediaAssets.generatedUrl, urls));
}
