import Image from "next/image";
import { Clapperboard, FolderHeart, ImageIcon } from "lucide-react";

import { PublishAssetButton } from "@/components/workspace/publish-asset-button";
import { Badge } from "@/components/ui/badge";
import { getMediaAssets } from "./actions";

export const metadata = { title: "ספריית תוכן AI" };

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ContentLibraryPage() {
  const assets = await getMediaAssets();

  return (
    <div className="space-y-8">
      <div>
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
        {assets.length > 0 && (
          <p className="mt-4 text-xs font-light text-muted-foreground">
            {assets.length} נכסים בספרייה ·{" "}
            {assets.filter((a) => a.status === "draft").length} ממתינים לפרסום
          </p>
        )}
      </div>

      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 border border-border/60 bg-background py-24 text-center">
          <ImageIcon
            className="h-10 w-10 text-muted-foreground"
            strokeWidth={0.75}
            aria-hidden
          />
          <div>
            <p className="font-serif text-xl font-light">הספרייה ריקה</p>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              צרו תמונות ווידאו בסטודיו AI — הן יישמרו כאן אוטומטית
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => {
            const isDraft = asset.status === "draft";
            const isVideo = asset.mediaType === "video";

            return (
              <article
                key={asset.id}
                className="group flex flex-col overflow-hidden border border-border/60 bg-background transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200">
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
                      alt={`נכס AI #${asset.id}`}
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
                      {isDraft ? "טיוטה" : "פורסם"}
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
                    <p className="text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                      נוצר ב־{dateFormatter.format(asset.createdAt)}
                    </p>
                    <p className="text-xs font-light text-muted-foreground/80">
                      {isVideo ? "קליפ וידאו" : "תמונת מוצר"} · מזהה #{asset.id}
                    </p>
                  </div>

                  {isDraft && !isVideo && (
                    <PublishAssetButton
                      assetId={asset.id}
                      imageUrl={asset.generatedUrl}
                    />
                  )}

                  {isDraft && isVideo && (
                    <p className="text-center text-[11px] font-light leading-relaxed text-muted-foreground">
                      וידאו נשמר בספרייה — הורידו מהסטודיו לשימוש ברשתות
                    </p>
                  )}

                  {!isDraft && (
                    <p className="text-center text-[11px] font-light text-emerald-800">
                      פורסם למלאי החנות
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
