"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Pencil } from "lucide-react";

import {
  generateProductListingContent,
  updateProduct,
} from "@/app/(workspace)/workspace/products/actions";
import type { products } from "@/db/schema";
import { ListingAiToolbar } from "@/components/workspace/listing-ai-toolbar";
import { ProductMediaEditor } from "@/components/workspace/product-media-editor";
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
import { resolveProductMedia } from "@/lib/product-media";

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
  const [title, setTitle] = React.useState(product.title);
  const [description, setDescription] = React.useState(
    product.description ?? ""
  );
  const [type, setType] =
    React.useState<(typeof PRODUCT_TYPES)[number]["value"]>(product.type);
  const [category, setCategory] = React.useState(product.category);
  const [aiPending, setAiPending] = React.useState<"fill" | "refine" | null>(
    null
  );
  const [aiNotice, setAiNotice] = React.useState<string | null>(null);

  const mediaItems = React.useMemo(
    () => resolveProductMedia(product),
    [product]
  );
  const hasImages = mediaItems.some((item) => item.type === "image");

  React.useEffect(() => {
    if (!open) return;
    setTitle(product.title);
    setDescription(product.description ?? "");
    setType(product.type);
    setCategory(product.category);
    setError(null);
    setAiNotice(null);
  }, [open, product]);

  async function runAi(mode: "fill" | "refine") {
    setError(null);
    setAiNotice(null);
    setAiPending(mode);

    try {
      const result = await generateProductListingContent({
        productId: product.id,
        mode,
        existingTitle: title,
        existingDescription: description,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setTitle(result.data.title);
      setDescription(result.data.description);
      setCategory(result.data.category);
      setType(result.data.type);
      setAiNotice(
        mode === "fill"
          ? "התוכן מולא אוטומטית — ניתן לערוך לפני השמירה"
          : "התוכן שופר — ניתן לערוך לפני השמירה"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "יצירת התוכן ב-AI נכשלה");
    } finally {
      setAiPending(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("type", type);
    formData.set("category", category);

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

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            עריכת תכשיט
          </SheetTitle>
          <SheetDescription className="font-light">
            עדכון פרטי המוצר במלאי
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <ListingAiToolbar
            aiPending={aiPending}
            canFill={hasImages}
            canRefine={Boolean(title.trim() || description.trim())}
            notice={aiNotice}
            onFill={() => runAi("fill")}
            onRefine={() => runAi("refine")}
          />

          <div className="space-y-2">
            <Label htmlFor={`title-${product.id}`} className="font-light">
              שם המוצר *
            </Label>
            <Input
              id={`title-${product.id}`}
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none rounded-none"
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
              required
              dir="rtl"
              value={type}
              onValueChange={(value) =>
                setType(value as (typeof PRODUCT_TYPES)[number]["value"])
              }
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת סוג" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="type" value={type} />
          </div>

          <div className="space-y-2">
            <Label className="font-light">קטגוריה *</Label>
            <Select
              required
              dir="rtl"
              value={category}
              onValueChange={setCategory}
            >
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="category" value={category} />
          </div>

          <ProductMediaEditor
            key={`media-${product.id}-${open ? "open" : "closed"}`}
            defaultItems={mediaItems}
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
