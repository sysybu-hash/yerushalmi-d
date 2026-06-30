"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, PackagePlus, Sparkles, Wand2 } from "lucide-react";

import {
  generateListingContent,
  publishListingFromAssets,
} from "@/app/(workspace)/workspace/content-library/actions";
import type { AiMediaAsset } from "@/db/schema";
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
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";

type CreateListingFromAssetsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: AiMediaAsset[];
  onPublished: () => void;
};

export function CreateListingFromAssetsSheet({
  open,
  onOpenChange,
  selectedAssets,
  onPublished,
}: CreateListingFromAssetsSheetProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [originalPrice, setOriginalPrice] = React.useState("");
  const [type, setType] =
    React.useState<(typeof PRODUCT_TYPES)[number]["value"]>("natural");
  const [category, setCategory] =
    React.useState<(typeof PRODUCT_CATEGORIES)[number]["value"]>("rings");
  const [pending, setPending] = React.useState(false);
  const [aiPending, setAiPending] = React.useState<"fill" | "refine" | null>(
    null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [aiNotice, setAiNotice] = React.useState<string | null>(null);

  const images = selectedAssets.filter((asset) => asset.mediaType === "image");
  const videos = selectedAssets.filter((asset) => asset.mediaType === "video");

  React.useEffect(() => {
    if (!open) return;
    const suggested = selectedAssets.find((asset) => asset.title)?.title;
    if (suggested && !title) {
      setTitle(suggested);
    }
  }, [open, selectedAssets, title]);

  React.useEffect(() => {
    if (!open) {
      setAiNotice(null);
      setError(null);
    }
  }, [open]);

  async function runAi(mode: "fill" | "refine") {
    setError(null);
    setAiNotice(null);
    setAiPending(mode);

    try {
      const result = await generateListingContent({
        assetIds: selectedAssets.map((asset) => asset.id),
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
          ? "התוכן מולא אוטומטית — ניתן לערוך לפני הפרסום"
          : "התוכן שופר — ניתן לערוך לפני הפרסום"
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "יצירת התוכן ב-AI נכשלה");
    } finally {
      setAiPending(null);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const priceNum = Number(price);
    if (!title.trim()) {
      setError("שם המוצר הוא שדה חובה");
      return;
    }
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      setError("יש להזין מחיר תקין");
      return;
    }

    const originalPriceNum = originalPrice ? Number(originalPrice) : null;
    if (
      originalPrice &&
      (originalPriceNum === null ||
        Number.isNaN(originalPriceNum) ||
        originalPriceNum < 0)
    ) {
      setError("מחיר לפני הנחה אינו תקין");
      return;
    }

    setPending(true);
    try {
      await publishListingFromAssets({
        assetIds: selectedAssets.map((asset) => asset.id),
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        originalPrice: originalPriceNum,
        type,
        category,
      });
      onPublished();
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "הפרסום נכשל");
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full overflow-y-auto sm:max-w-lg"
      >
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            יצירת מודעה חדשה
          </SheetTitle>
          <SheetDescription className="font-light">
            {selectedAssets.length} נכסים נבחרו · {images.length} תמונות
            {videos.length > 0 ? ` · ${videos.length} וידאו` : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {selectedAssets.map((asset) => (
            <div
              key={asset.id}
              className="relative h-20 w-20 shrink-0 overflow-hidden border border-border/60 bg-muted/30"
            >
              {asset.mediaType === "video" ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={asset.generatedUrl}
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={asset.generatedUrl}
                  alt={asset.title ?? `נכס ${asset.id}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={aiPending !== null || pending || images.length === 0}
              onClick={() => runAi("fill")}
              className="rounded-none text-xs font-light tracking-wide"
            >
              {aiPending === "fill" ? (
                <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              מילוי אוטומטי עם AI
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                aiPending !== null ||
                pending ||
                (!title.trim() && !description.trim())
              }
              onClick={() => runAi("refine")}
              className="rounded-none text-xs font-light tracking-wide"
            >
              {aiPending === "refine" ? (
                <Loader2 className="ml-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="ml-2 h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              שפר ומטב
            </Button>
          </div>

          {aiNotice && (
            <p className="text-xs font-light text-emerald-700">{aiNotice}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="listing-title" className="font-light">
              שם המוצר *
            </Label>
            <Input
              id="listing-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="לדוגמה: עגילי יהלום סוליטר"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-description" className="font-light">
              תיאור המודעה
            </Label>
            <Textarea
              id="listing-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="תיאור שיוצג בדף המוצר בחנות..."
              className="resize-none rounded-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="listing-price" className="font-light">
                מחיר (₪) *
              </Label>
              <Input
                id="listing-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="0.00"
                className="rounded-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="listing-original-price" className="font-light">
                מחיר לפני הנחה
              </Label>
              <Input
                id="listing-original-price"
                type="number"
                min="0"
                step="0.01"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="אופציונלי"
                className="rounded-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-light">סוג יהלום *</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as (typeof PRODUCT_TYPES)[number]["value"])
                }
                dir="rtl"
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-light">קטגוריה *</Label>
              <Select
                value={category}
                onValueChange={(v) =>
                  setCategory(
                    v as (typeof PRODUCT_CATEGORIES)[number]["value"]
                  )
                }
                dir="rtl"
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
            התמונה הראשונה תהיה תמונת הכריכה. שאר התמונות והסרטונים יוצגו
            בגלריית המוצר בחנות.
          </p>

          {error && (
            <p className="text-sm font-light text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={pending || images.length === 0}
            className="w-full rounded-none text-xs font-light tracking-[0.15em]"
          >
            {pending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <PackagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
            )}
            פרסום למלאי החנות
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
