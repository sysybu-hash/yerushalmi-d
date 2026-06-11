import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, Gem, ShieldCheck } from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { categoryLabel, TYPE_LABELS } from "@/lib/product-labels";

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

  return { title: product?.title ?? "מוצר לא נמצא" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) notFound();

  const price = Number(product.price);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;
  const onSale = originalPrice !== null && originalPrice > price;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-16">
      <Button
        asChild
        variant="ghost"
        className="mb-8 rounded-none px-0 text-xs font-light tracking-[0.15em] text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <Link href={`/collections/${product.category}`}>
          <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.25} />
          חזרה ל{categoryLabel(product.category)}
        </Link>
      </Button>

      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        {/* תמונה */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-gold/50">
              <Gem aria-hidden className="h-16 w-16" strokeWidth={0.5} />
              <p className="text-[11px] tracking-[0.3em]">ירושלמי יהלומים</p>
            </div>
          )}
          {onSale && (
            <span className="absolute right-4 top-4 bg-gold px-3 py-1.5 text-[10px] font-medium tracking-[0.15em] text-charcoal">
              מבצע
            </span>
          )}
        </div>

        {/* פרטים */}
        <div className="fade-up">
          <p className="text-[11px] tracking-[0.3em] text-gold-dark">
            {categoryLabel(product.category)}
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
              תכשיט {categoryLabel(product.category)} באיכות גימולוגית מלאה —
              לפרטים נוספים, צרו קשר ונשמח לייעץ.
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
    </section>
  );
}
