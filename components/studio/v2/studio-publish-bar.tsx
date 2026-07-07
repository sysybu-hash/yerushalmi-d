"use client";

import * as React from "react";
import { Copy, Download, FolderHeart, Store, Loader2 } from "lucide-react";

import {
  publishProductToCatalog,
  saveAssetToCloudinary,
  saveToMediaLibrary,
} from "@/app/(ai-studio)/studio/actions";
import type { StudioV2State } from "@/lib/studio-client/state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** פס פרסום — מופיע רק כשיש תוצאה מוכנה */
export function StudioPublishBar({
  state,
  onTitleChange,
  onPriceChange,
  showToast,
  onPublished,
}: {
  state: StudioV2State;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  showToast: (message: string) => void;
  onPublished: (productId: number) => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const result = state.result;

  if (!result.url || !result.kind || !state.source.url) return null;

  const resultUrl = result.url;
  const resultKind = result.kind;
  const sourceUrl = state.source.url;

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
        price,
        category: "rings",
        type: "natural",
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
      </div>

      {resultKind === "image" && (
        <div className="space-y-2 border-t border-emerald-600/20 pt-3">
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
