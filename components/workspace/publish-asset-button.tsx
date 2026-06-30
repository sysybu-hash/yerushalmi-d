"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus } from "lucide-react";

import { markAssetAsPublished } from "@/app/(workspace)/workspace/content-library/actions";
import { Button } from "@/components/ui/button";

type PublishAssetButtonProps = {
  assetId: number;
  imageUrl: string;
};

export function PublishAssetButton({ assetId, imageUrl }: PublishAssetButtonProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handlePublish() {
    setPending(true);
    try {
      await markAssetAsPublished(assetId);
      router.push(
        `/workspace/products?image_url=${encodeURIComponent(imageUrl)}`
      );
    } catch (error) {
      setPending(false);
      window.alert(
        error instanceof Error ? error.message : "הפרסום נכשל — נסו שוב"
      );
    }
  }

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={handlePublish}
      className="w-full rounded-none text-xs font-light tracking-[0.12em]"
    >
      {pending ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <PackagePlus className="ml-2 h-4 w-4" strokeWidth={1.5} />
      )}
      פרסם כמוצר חדש
    </Button>
  );
}
