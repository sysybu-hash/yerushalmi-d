export type ProductMediaItem = {
  type: "image" | "video";
  url: string;
};

/** מאחד שדות מוצר ישנים וגלריה חדשה לרשימת מדיה אחת */
export function resolveProductMedia(input: {
  imageUrl: string | null;
  secondaryImageUrl?: string | null;
  videoUrl?: string | null;
  mediaGallery?: ProductMediaItem[] | null;
}): ProductMediaItem[] {
  if (input.mediaGallery && input.mediaGallery.length > 0) {
    return input.mediaGallery;
  }

  const items: ProductMediaItem[] = [];
  if (input.imageUrl) items.push({ type: "image", url: input.imageUrl });
  if (input.secondaryImageUrl) {
    items.push({ type: "image", url: input.secondaryImageUrl });
  }
  if (input.videoUrl) items.push({ type: "video", url: input.videoUrl });
  return items;
}
