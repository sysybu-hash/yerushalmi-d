import Image from "next/image";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Gem } from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { getSiteSettings } from "@/lib/site-settings";
import {
  collectionLabel,
  getCategoryBannerImage,
  isCollectionSlug,
} from "@/lib/categories";
import {
  SITE_HEADER_HERO_PADDING_CLASS,
  SITE_HEADER_NEGATIVE_OFFSET_CLASS,
} from "@/lib/site-layout";
import { ProductCard } from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: { category: string };
};

export function generateMetadata({ params }: CategoryPageProps) {
  if (!isCollectionSlug(params.category)) {
    return { title: "קולקציה לא נמצאה" };
  }
  return { title: collectionLabel(params.category) };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  if (!isCollectionSlug(params.category)) {
    notFound();
  }

  const [settings, categoryProducts] = await Promise.all([
    getSiteSettings(),
    db
      .select()
      .from(products)
      .where(eq(products.category, params.category))
      .orderBy(desc(products.createdAt)),
  ]);

  const image = getCategoryBannerImage(params.category, settings);
  const title = collectionLabel(params.category, settings);

  return (
    <>
      <section
        className={`relative ${SITE_HEADER_NEGATIVE_OFFSET_CLASS} flex min-h-[48vh] flex-col items-center justify-center overflow-hidden bg-charcoal px-4 ${SITE_HEADER_HERO_PADDING_CLASS} text-center`}
      >
        {image ? (
          <Image
            src={image}
            alt={`קולקציית ${title} — ירושלמי יהלומים`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,154,94,0.18),transparent_55%)]"
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-black/55" />

        <div className="relative">
          <p className="text-[11px] tracking-[0.3em] text-gold-light">
            הקולקציות שלנו
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-wide text-ivory sm:text-5xl">
            {title}
          </h1>
          <span className="mx-auto mt-6 block h-px w-16 bg-gold" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Gem
              aria-hidden
              className="h-10 w-10 text-gold/60"
              strokeWidth={0.75}
            />
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              קולקציה זו מתעדכנת בימים אלה — נשמח לראותכם בקרוב
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-light text-muted-foreground">
              {categoryProducts.length} פריטים בקולקציה
            </p>
            <div className="fade-up mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
