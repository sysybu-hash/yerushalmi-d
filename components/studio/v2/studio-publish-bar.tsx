"use client";

import * as React from "react";
import {
  Copy,
  Download,
  FolderHeart,
  Store,
  Loader2,
  Wand2,
  Repeat,
} from "lucide-react";

import { ToggleChip } from "@/components/studio/studio-adjust-ui";
import {
  ASPECT_OPTIONS,
  buildTransformedUrl,
  DEFAULT_IMAGE_ADJUSTMENTS,
  type AspectId,
} from "@/lib/studio-transform";

import {
  generateStudioListing,
  publishProductToCatalog,
  saveAssetToCloudinary,
  saveToMediaLibrary,
} from "@/app/(ai-studio)/studio/actions";
import type { StudioV2State } from "@/lib/studio-client/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES } from "@/components/workspace/product-constants";

/** פס פרסום — מופיע רק כשיש תוצאה מוכנה */
export function StudioPublishBar({
  state,
  onTitleChange,
  onPriceChange,
  onAspectChange,
  onContinueEditing,
  showToast,
  onPublished,
}: {
  state: StudioV2State;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onAspectChange: (value: AspectId) => void;
  onContinueEditing: () => void;
  showToast: (message: string) => void;
  onPublished: (productId: number) => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("rings");
  const [productType, setProductType] = React.useState<"natural" | "lab">(
    "natural"
  );
  const result = state.result;

  if (!result.url || !result.kind || !state.source.url) return null;

  const resultKind = result.kind;
  const sourceUrl = state.source.url;
  // יחס גובה-רוחב מוחל על כל היציאות (הורדה/קישור/פרסום) — טרנספורמציה חינמית
  const resultUrl =
    resultKind === "image" && state.resultAspect !== "original"
      ? buildTransformedUrl(result.url, "image", {
          ...DEFAULT_IMAGE_ADJUSTMENTS,
          autoEnhance: false,
          autoColor: false,
          sharpen: false,
          contrast: 0,
          upscale: false,
          aspect: state.resultAspect,
        })
      : result.url;

  async function copyUrl() {
    await navigator.clipboard.writeText(resultUrl);
    showToast("הקישור הועתק");
  }

  async function saveToLibrary() {
    setBusy("library");
    try {
      const { url } = await saveAssetToCloudinary(resultUrl, resultKind);
      await saveToMediaLibrary(resultKind, sourceUrl, url);
      showToast("נשמר בספריית התוכן");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "השמירה נכשלה");
    } finally {
      setBusy(null);
    }
  }

  async function fillWithAi() {
    setBusy("ai-fill");
    try {
      const generated = await generateStudioListing(resultUrl);
      if (!generated.ok) {
        showToast(generated.error);
        return;
      }
      onTitleChange(generated.data.title);
      setDescription(generated.data.description);
      setCategory(generated.data.category);
      setProductType(generated.data.type);
      showToast("הפרטים מולאו ב-AI — בדקו והשלימו מחיר");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "מילוי ה-AI נכשל");
    } finally {
      setBusy(null);
    }
  }

  async function publishProduct() {
    const price = Number(state.productPrice);
    if (!state.productTitle.trim()) {
      showToast("הזינו שם מוצר");
      return;
    }
    if (!state.productPrice || Number.isNaN(price) || price < 0) {
      showToast("הזינו מחיר תקין");
      return;
    }
    setBusy("catalog");
    try {
      const { productId } = await publishProductToCatalog({
        title: state.productTitle,
        description: description.trim() || undefined,
        price,
        category,
        type: productType,
        imageUrl: resultUrl,
      });
      showToast("המוצר פורסם לקטלוג");
      onPublished(productId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "הפרסום נכשל");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3 border border-emerald-600/30 bg-emerald-600/5 p-3">
      <p className="text-xs font-light tracking-[0.1em] text-emerald-700">
        התוצאה מוכנה — מה עושים איתה?
      </p>

      {resultKind === "image" && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-light text-muted-foreground">
            פורמט (חינם — חל על ההורדה והפרסום)
          </p>
          <div className="flex flex-wrap gap-2">
            {ASPECT_OPTIONS.map((option) => (
              <ToggleChip
                key={option.id}
                label={option.label}
                active={state.resultAspect === option.id}
                onClick={() => onAspectChange(option.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={copyUrl}
          className="rounded-none text-xs font-light"
        >
          <Copy className="ml-1.5 h-3.5 w-3.5" />
          העתקת קישור
        </Button>
        <Button
          size="sm"
          variant="outline"
          asChild
          className="rounded-none text-xs font-light"
        >
          <a href={resultUrl} target="_blank" rel="noreferrer" download>
            <Download className="ml-1.5 h-3.5 w-3.5" />
            הורדה
          </a>
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={saveToLibrary}
          className="rounded-none text-xs font-light"
        >
          {busy === "library" ? (
            <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <FolderHeart className="ml-1.5 h-3.5 w-3.5" />
          )}
          שמירה בספרייה
        </Button>
        {resultKind === "image" && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={onContinueEditing}
            title="התוצאה הופכת למקור לסיבוב עיצוב נוסף"
            className="rounded-none text-xs font-light"
          >
            <Repeat className="ml-1.5 h-3.5 w-3.5" />
            המשך עריכה מהתוצאה
          </Button>
        )}
      </div>

      {resultKind === "image" && (
        <div className="space-y-2 border-t border-emerald-600/20 pt-3">
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={fillWithAi}
            className="w-full rounded-none border-gold/40 text-xs font-light text-gold-dark hover:bg-gold/10"
          >
            {busy === "ai-fill" ? (
              <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Wand2 className="ml-1.5 h-3.5 w-3.5" />
            )}
            מילוי שם, תיאור וקטגוריה ב-AI
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Input
              dir="rtl"
              placeholder="שם המוצר"
              value={state.productTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              className="rounded-none text-sm font-light"
            />
            <Input
              dir="rtl"
              inputMode="decimal"
              placeholder="מחיר (₪)"
              value={state.productPrice}
              onChange={(e) => onPriceChange(e.target.value)}
              className="rounded-none text-sm font-light"
            />
          </div>
          <Textarea
            dir="rtl"
            rows={2}
            placeholder="תיאור המוצר (אופציונלי)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-none text-sm font-light"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              dir="rtl"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 border border-input bg-background px-2 text-sm font-light"
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              dir="rtl"
              value={productType}
              onChange={(e) =>
                setProductType(e.target.value === "lab" ? "lab" : "natural")
              }
              className="h-9 border border-input bg-background px-2 text-sm font-light"
            >
              <option value="natural">יהלום טבעי</option>
              <option value="lab">יהלום מעבדה</option>
            </select>
          </div>
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={publishProduct}
            className="w-full rounded-none bg-emerald-700 text-xs font-light text-white hover:bg-emerald-800"
          >
            {busy === "catalog" ? (
              <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Store className="ml-1.5 h-3.5 w-3.5" />
            )}
            פרסום כמוצר חדש בקטלוג
          </Button>
        </div>
      )}
    </div>
  );
}
