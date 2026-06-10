import Image from "next/image";
import { Gem, ImageOff } from "lucide-react";

import { AddProductSheet } from "@/components/workspace/add-product-sheet";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";
import { DeleteProductButton } from "@/components/workspace/delete-product-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProducts } from "./actions";

export const metadata = { title: "ניהול מלאי" };

// העמוד קורא מהדאטהבייס — חייב להירנדר בכל בקשה
export const dynamic = "force-dynamic";

const CATEGORY_LABELS = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.value, c.label])
);

const TYPE_LABELS = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t.value, t.label])
);

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-8">
      {/* כותרת ופעולות */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            ניהול מלאי
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {products.length > 0
              ? `${products.length} תכשיטים במלאי`
              : "ניהול קולקציית התכשיטים של החנות"}
          </p>
        </div>
        <AddProductSheet />
      </div>

      {/* טבלת מוצרים */}
      <div className="border border-border/60 bg-background">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Gem
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">המלאי ריק</p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                לחצו על &quot;תכשיט חדש&quot; כדי להוסיף את הפריט הראשון
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-right font-light">
                  תמונה
                </TableHead>
                <TableHead className="text-right font-light">שם</TableHead>
                <TableHead className="text-right font-light">
                  קטגוריה
                </TableHead>
                <TableHead className="text-right font-light">
                  סוג יהלום
                </TableHead>
                <TableHead className="text-right font-light">מחיר</TableHead>
                <TableHead className="text-left font-light">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.imageUrl ? (
                      <div className="relative h-12 w-12 overflow-hidden border border-border/60">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center border border-dashed border-border/60 bg-muted/30">
                        <ImageOff
                          className="h-4 w-4 text-muted-foreground"
                          strokeWidth={1.25}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{product.title}</p>
                    {product.description && (
                      <p className="mt-0.5 max-w-md truncate text-xs font-light text-muted-foreground">
                        {product.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-light">
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </TableCell>
                  <TableCell className="font-light">
                    {TYPE_LABELS[product.type] ?? product.type}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {priceFormatter.format(Number(product.price))}
                  </TableCell>
                  <TableCell className="text-left">
                    <DeleteProductButton
                      id={product.id}
                      title={product.title}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
