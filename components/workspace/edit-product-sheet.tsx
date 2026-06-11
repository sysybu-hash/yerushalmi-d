"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Pencil } from "lucide-react";

import { updateProduct } from "@/app/(workspace)/workspace/products/actions";
import type { products } from "@/db/schema";
import { ProductImageField } from "@/components/workspace/product-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";

type Product = typeof products.$inferSelect;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-none text-xs font-light tracking-[0.15em]"
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        "שמירת שינויים"
      )}
    </Button>
  );
}

export function EditProductSheet({ product }: { product: Product }) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await updateProduct(product.id, formData);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "השמירה נכשלה");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`עריכת ${product.title}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            עריכת תכשיט
          </SheetTitle>
          <SheetDescription className="font-light">
            עדכון פרטי המוצר במלאי
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`title-${product.id}`} className="font-light">
              שם המוצר *
            </Label>
            <Input
              id={`title-${product.id}`}
              name="title"
              required
              defaultValue={product.title}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`description-${product.id}`}
              className="font-light"
            >
              תיאור
            </Label>
            <Textarea
              id={`description-${product.id}`}
              name="description"
              rows={4}
              defaultValue={product.description ?? ""}
              className="rounded-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`original_price-${product.id}`}
              className="font-light"
            >
              מחיר לפני הנחה (אופציונלי)
            </Label>
            <Input
              id={`original_price-${product.id}`}
              name="original_price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={product.originalPrice ?? ""}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`price-${product.id}`} className="font-light">
              מחיר (₪) *
            </Label>
            <Input
              id={`price-${product.id}`}
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              defaultValue={product.price}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-light">סוג יהלום *</Label>
            <Select
              name="type"
              required
              dir="rtl"
              defaultValue={product.type}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת סוג" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-light">קטגוריה *</Label>
            <Select
              name="category"
              required
              dir="rtl"
              defaultValue={product.category}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ProductImageField
            key={`primary-${product.id}-${product.imageUrl ?? "none"}`}
            name="image_url"
            label="תמונה ראשית"
            defaultValue={product.imageUrl}
            uploadLabel="העלאת תמונה ראשית"
          />

          <ProductImageField
            key={`secondary-${product.id}-${product.secondaryImageUrl ?? "none"}`}
            name="secondary_image_url"
            label="תמונה שנייה (אופציונלי)"
            defaultValue={product.secondaryImageUrl}
            uploadLabel="העלאת תמונה שנייה"
          />

          {error && (
            <p className="text-sm font-light text-destructive">{error}</p>
          )}

          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
