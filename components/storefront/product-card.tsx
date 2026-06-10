import Image from "next/image";
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
    <Card className="group rounded-none border-border/60 shadow-none transition-shadow hover:shadow-lg">
      {/* תמונת המוצר מ־Cloudinary, או fallback אלגנטי */}
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <Gem
            aria-hidden
            className="h-8 w-8 text-stone-400 transition-transform duration-500 group-hover:scale-110"
            strokeWidth={0.75}
          />
        )}
      </div>

      <CardContent className="space-y-2 p-4 text-center">
        <h3 className="truncate text-sm font-light" title={product.title}>
          {product.title}
        </h3>

        <div className="flex items-center justify-center gap-2">
          {onSale && (
            <span className="text-sm font-light text-muted-foreground line-through">
              {priceFormatter.format(originalPrice)}
            </span>
          )}
          <span
            className={
              onSale ? "text-sm font-medium text-red-700" : "text-sm font-medium"
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
