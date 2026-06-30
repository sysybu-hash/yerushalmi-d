"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Clapperboard,
  FolderHeart,
  ImageIcon,
  Pencil,
  PackagePlus,
} from "lucide-react";

import type { AiMediaAsset } from "@/db/schema";
import { CreateListingFromAssetsSheet } from "@/components/workspace/create-listing-from-assets-sheet";
import { EditMediaAssetDialog } from "@/components/workspace/edit-media-asset-dialog";
import { AssetManageButtons } from "@/components/workspace/asset-manage-buttons";
import { AiCrossNav } from "@/components/workspace/ai-cross-nav";
import { RestoreAssetButton } from "@/components/workspace/restore-asset-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type ContentLibraryWorkspaceProps = {
  assets: AiMediaAsset[];
};

type LibraryView = "active" | "archived";

function statusLabel(status: string) {
  if (status === "draft") return "טיוטה";
  if (status === "published") return "פורסם";
  if (status === "archived") return "בארכיון";
  return status;
}

export function ContentLibraryWorkspace({ assets }: ContentLibraryWorkspaceProps) {
  const router = useRouter();
  const [view, setView] = React.useState<LibraryView>("active");
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());
  const [listingOpen, setListingOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<AiMediaAsset | null>(
    null
  );

  const activeAssets = assets.filter((asset) => asset.status !== "archived");
  const archivedAssets = assets.filter((asset) => asset.status === "archived");
  const visibleAssets = view === "active" ? activeAssets : archivedAssets;
  const draftAssets = activeAssets.filter((asset) => asset.status === "draft");
  const selectedAssets = visibleAssets.filter((asset) => selectedIds.has(asset.id));
  const selectedImages = selectedAssets.filter(
    (asset) => asset.mediaType === "image"
  );

  function toggleAsset(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllDrafts() {
    setSelectedIds(new Set(draftAssets.map((asset) => asset.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handlePublished() {
    clearSelection();
    router.refresh();
  }

  return (
    <div className="space-y-8 pb-28">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderHeart
              className="h-8 w-8 text-gold-dark"
              strokeWidth={0.75}
              aria-hidden
            />
            <div>
              <h1 className="font-serif text-3xl font-light tracking-wide">
                ספריית תוכן AI
              </h1>
              <p className="mt-2 text-sm font-light text-muted-foreground">
                ניהול ופרסום חומרים שנוצרו בסטודיו
              </p>
            </div>
          </div>

          <AiCrossNav current="content-library" />
        </div>

        {view === "active" && draftAssets.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAllDrafts}
              className="rounded-none text-xs font-light"
            >
              בחירת כל הטיוטות
            </Button>
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="rounded-none text-xs font-light"
              >
                ניקוי בחירה
              </Button>
            )}
          </div>
        )}

        {assets.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p className="text-xs font-light text-muted-foreground">
              {activeAssets.length} פעילים · {draftAssets.length} לפרסום ·{" "}
              {archivedAssets.length} בארכיון
            </p>
            <div className="flex gap-1 border border-border/60 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setView("active");
                  clearSelection();
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-light tracking-wide transition-colors",
                  view === "active"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                פעילים
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("archived");
                  clearSelection();
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-light tracking-wide transition-colors",
                  view === "archived"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                ארכיון ({archivedAssets.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {visibleAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border/60 bg-background py-24 text-center">
          <ImageIcon
            className="h-10 w-10 text-muted-foreground"
            strokeWidth={0.75}
            aria-hidden
          />
          <div>
            <p className="font-serif text-xl font-light">
              {view === "archived" ? "הארכיון ריק" : "הספרייה ריקה"}
            </p>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              {view === "archived"
                ? "נכסים שהועברו לארכיון יופיעו כאן"
                : "צרו תמונות ווידאו בסטודיו AI — הן יישמרו כאן אוטומטית"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAssets.map((asset) => {
            const isDraft = asset.status === "draft";
            const isPublished = asset.status === "published";
            const isArchived = asset.status === "archived";
            const isVideo = asset.mediaType === "video";
            const isSelected = selectedIds.has(asset.id);

            return (
              <article
                key={asset.id}
                className={cn(
                  "group flex flex-col overflow-hidden border bg-background transition-shadow hover:shadow-md",
                  isArchived && "opacity-90",
                  isSelected
                    ? "border-gold ring-1 ring-gold/40"
                    : "border-border/60"
                )}
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
                  {isDraft && (
                    <button
                      type="button"
                      onClick={() => toggleAsset(asset.id)}
                      aria-pressed={isSelected}
                      aria-label={
                        isSelected ? "ביטול בחירת נכס" : "בחירת נכס למודעה"
                      }
                      className={cn(
                        "absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center border transition-colors",
                        isSelected
                          ? "border-gold bg-gold text-charcoal"
                          : "border-border/60 bg-background/90 text-muted-foreground hover:border-gold/60"
                      )}
                    >
                      {isSelected ? (
                        <Check className="h-4 w-4" strokeWidth={2} />
                      ) : null}
                    </button>
                  )}

                  {isVideo ? (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video
                      src={asset.generatedUrl}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Image
                      src={asset.generatedUrl}
                      alt={asset.title ?? `נכס AI #${asset.id}`}
                      fill
                      sizes="(max-width: 1280px) 50vw, 33vw"
                      className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  )}

                  <div className="absolute left-3 top-3 flex items-center gap-2">
                    <Badge
                      variant={isDraft ? "outline" : "secondary"}
                      className="rounded-none border-border/60 bg-background/90 text-[10px] font-light tracking-[0.08em] backdrop-blur-sm"
                    >
                      {statusLabel(asset.status)}
                    </Badge>
                    {isVideo && (
                      <Badge
                        variant="outline"
                        className="rounded-none border-gold/40 bg-gold/10 text-[10px] font-light text-gold-dark backdrop-blur-sm"
                      >
                        <Clapperboard className="ml-1 h-3 w-3" />
                        וידאו
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 border-t border-border/40 p-4">
                  <div className="space-y-1">
                    {asset.title && (
                      <p className="text-sm font-light text-foreground">
                        {asset.title}
                      </p>
                    )}
                    <p className="text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                      נוצר ב־{dateFormatter.format(asset.createdAt)}
                    </p>
                    <p className="text-xs font-light text-muted-foreground/80">
                      {isVideo ? "קליפ וידאו" : "תמונת מוצר"} · מזהה #{asset.id}
                    </p>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingAsset(asset)}
                        className="rounded-none text-xs font-light"
                      >
                        <Pencil className="ml-1.5 h-3.5 w-3.5" />
                        עריכה
                      </Button>

                      {isDraft && !isVideo && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setSelectedIds(new Set([asset.id]));
                            setListingOpen(true);
                          }}
                          className="rounded-none text-xs font-light"
                        >
                          <PackagePlus className="ml-1.5 h-3.5 w-3.5" />
                          פרסום מהיר
                        </Button>
                      )}
                    </div>

                    {isDraft && isVideo && (
                      <p className="text-[11px] font-light leading-relaxed text-muted-foreground">
                        בחרו עם תמונות למודעה אחת
                      </p>
                    )}

                    <AssetManageButtons asset={asset} />

                    {isPublished && (
                      <div className="space-y-2 border-t border-border/40 pt-3">
                        <p className="text-center text-[11px] font-light text-emerald-800">
                          פורסם למלאי החנות
                        </p>
                        {asset.publishedProductId ? (
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="w-full rounded-none text-xs font-light"
                          >
                            <Link href="/workspace/products">צפייה במלאי</Link>
                          </Button>
                        ) : null}
                        <RestoreAssetButton assetId={asset.id} />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {view === "active" && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur-md sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
            <div className="text-sm font-light">
              <span className="text-foreground">{selectedIds.size} נבחרו</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">
                {selectedImages.length} תמונות
                {selectedAssets.length - selectedImages.length > 0
                  ? ` · ${selectedAssets.length - selectedImages.length} וידאו`
                  : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearSelection}
                className="rounded-none text-xs font-light"
              >
                ביטול
              </Button>
              <Button
                type="button"
                disabled={selectedImages.length === 0}
                onClick={() => setListingOpen(true)}
                className="rounded-none text-xs font-light tracking-[0.12em]"
              >
                <PackagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
                צור מודעה מנכסים נבחרים
              </Button>
            </div>
          </div>
        </div>
      )}

      <CreateListingFromAssetsSheet
        open={listingOpen}
        onOpenChange={setListingOpen}
        selectedAssets={selectedAssets}
        onPublished={handlePublished}
      />

      <EditMediaAssetDialog
        asset={editingAsset}
        open={editingAsset !== null}
        onOpenChange={(open) => {
          if (!open) setEditingAsset(null);
        }}
        onUpdated={() => router.refresh()}
      />
    </div>
  );
}
