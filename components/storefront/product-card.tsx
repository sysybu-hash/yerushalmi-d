import Image from "next/image";
import Link from "next/link";
import { Gem } from "lucide-react";

import type { Product } from "@/db/schema";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Card, CardContent } from "@/components/ui/card";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

export function ProductCard({ product }: { product: Product }) {
  const price = Number(product.price);
  const originalPrice = product.originalPrice
    ? Number(product.originalPrice)
    : null;
  const onSale = originalPrice !== null && originalPrice > price;

  return (
    <Card className="group relative rounded-none border-border/60 bg-card shadow-none transition-all duration-300 hover:border-gold/50 hover:shadow-lg">
      {/* תג מבצע */}
      {onSale && (
        <span className="absolute right-3 top-3 z-10 bg-gold px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-charcoal">
          מבצע
        </span>
      )}

      {/* תמונת המוצר — לחיצה מובילה לדף המוצר */}
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted"
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gem
              aria-hidden
              className="h-8 w-8 text-gold/50 transition-transform duration-500 group-hover:scale-110"
              strokeWidth={0.75}
            />
          </div>
        )}
      </Link>

      <CardContent className="space-y-2.5 p-4 text-center">
        <Link href={`/products/${product.id}`}>
          <h3
            className="truncate text-sm font-normal text-foreground transition-colors hover:text-gold-dark"
            title={product.title}
          >
            {product.title}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2">
          {onSale && (
            <span className="text-xs font-light text-muted-foreground line-through">
              {priceFormatter.format(originalPrice)}
            </span>
          )}
          <span
            className={
              onSale
                ? "text-base font-medium text-gold-dark"
                : "text-base font-medium text-foreground"
            }
          >
            {priceFormatter.format(price)}
          </span>
        </div>

        <AddToCartButton
          id={product.id}
          title={product.title}
          price={price}
          imageUrl={product.imageUrl}
        />
      </CardContent>
    </Card>
  );
}
