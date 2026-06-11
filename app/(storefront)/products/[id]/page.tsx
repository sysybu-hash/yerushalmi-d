import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { ChevronLeft, ShieldCheck } from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { ProductImages } from "@/components/storefront/product-images";
import { ProductCard } from "@/components/storefront/product-card";
import { Button } from "@/components/ui/button";
import { collectionLabel } from "@/lib/categories";
import { TYPE_LABELS } from "@/lib/product-labels";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

type ProductPageProps = {
  params: { id: string };
};

export async function generateMetadata({ params }: ProductPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return { title: "מוצר" };

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) return { title: "מוצר לא נמצא" };

  const description =
    product.description?.slice(0, 160) ??
    "תכשיט יוקרה בעבודת יד עם אחריות מלאה ותעודה גימולוגית.";

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [product, settings] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, id) }),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const similarProducts = await db
    .select()
    .from(products)
    .where(
      and(eq(products.category, product.category), ne(products.id, product.id))
    )
    .limit(4);

  const price = Number(product.price);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;
  const onSale = originalPrice !== null && originalPrice > price;
  const catLabel = collectionLabel(product.category, settings);

  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    category: catLabel,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "ILS",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/products/${product.id}`,
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: catLabel,
        item: `${siteUrl}/collections/${product.category}`,
      },
      { "@type": "ListItem", position: 3, name: product.title },
    ],
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([jsonLd, breadcrumbLd]),
        }}
      />
      <nav
        aria-label="ניווט"
        className="mb-8 flex flex-wrap items-center gap-2 text-xs font-light text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-foreground">
          דף הבית
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" aria-hidden />
        <Link
          href={`/collections/${product.category}`}
          className="transition-colors hover:text-foreground"
        >
          {catLabel}
        </Link>
        <ChevronLeft className="h-3 w-3 rotate-180" aria-hidden />
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <ProductImages
            title={product.title}
            imageUrl={product.imageUrl}
            secondaryImageUrl={product.secondaryImageUrl}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            variant="gallery"
          />
          {onSale ? (
            <span className="absolute right-4 top-4 z-10 bg-gold px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] text-charcoal">
              מבצע
            </span>
          ) : null}
        </div>

        <div className="fade-up">
          <p className="text-[11px] tracking-[0.3em] text-gold-dark">
            {catLabel}
          </p>

          <h1 className="mt-4 font-serif text-3xl font-medium leading-snug tracking-wide sm:text-4xl">
            {product.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            {onSale && (
              <span className="text-lg font-light text-muted-foreground line-through">
                {priceFormatter.format(originalPrice!)}
              </span>
            )}
            <span
              className={
                onSale
                  ? "font-serif text-3xl font-medium text-gold-dark"
                  : "font-serif text-3xl font-medium"
              }
            >
              {priceFormatter.format(price)}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="border border-border/60 px-3 py-1 text-[11px] tracking-[0.1em] text-muted-foreground">
              {TYPE_LABELS[product.type] ?? product.type}
            </span>
            <span className="inline-flex items-center gap-1.5 border border-gold/40 px-3 py-1 text-[11px] tracking-[0.1em] text-gold-dark">
              <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.25} />
              אחריות + תעודה גימולוגית
            </span>
          </div>

          {product.description ? (
            <div className="mt-8 border-r-2 border-gold/30 pr-5">
              <p className="text-sm font-light leading-relaxed text-foreground/80 sm:text-base">
                {product.description}
              </p>
            </div>
          ) : (
            <p className="mt-8 text-sm font-light leading-relaxed text-muted-foreground">
              תכשיט {catLabel} באיכות גימולוגית מלאה — לפרטים נוספים, צרו קשר
              ונשמח לייעץ.
            </p>
          )}

          <div className="mt-10 max-w-sm">
            <AddToCartButton
              id={product.id}
              title={product.title}
              price={price}
              imageUrl={product.imageUrl}
            />
          </div>

          <p className="mt-6 text-xs font-light leading-relaxed text-muted-foreground">
            משלוח עד הבית · שירות אישי · ייעוץ מקצועי ללא התחייבות
          </p>
        </div>
      </div>

      {similarProducts.length > 0 && (
        <div className="mt-20 border-t border-border/60 pt-16">
          <h2 className="font-serif text-2xl font-light tracking-wide">
            תכשיטים דומים
          </h2>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            עוד מ{catLabel}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              asChild
              variant="outline"
              className="rounded-none text-xs font-light tracking-[0.15em]"
            >
              <Link href={`/collections/${product.category}`}>
                לכל {catLabel}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
