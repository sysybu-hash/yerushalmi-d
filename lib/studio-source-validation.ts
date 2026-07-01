import { loadSharp } from "@/lib/sharp-loader";
import { STUDIO_MIN_SOURCE_PX } from "@/lib/studio-presets";

export async function validateSourceImageResolution(
  imageUrl: string
): Promise<void> {
  const response = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error("לא ניתן להוריד את תמונת המקור");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const sharp = await loadSharp();
  const meta = await sharp(buffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const shortSide = Math.min(width, height);

  if (shortSide < STUDIO_MIN_SOURCE_PX) {
    throw new Error(
      `רזולוציית התמונה נמוכה מדי (${width}×${height}). מינימום ${STUDIO_MIN_SOURCE_PX}px בצד הקצר — צלמו מחדש ברזולוציה גבוהה יותר.`
    );
  }
}
