"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, RotateCcw, Trash2 } from "lucide-react";

import {
  archiveMediaAsset,
  deleteMediaAsset,
  restoreAssetFromArchive,
} from "@/app/(workspace)/workspace/content-library/actions";
import type { AiMediaAsset } from "@/db/schema";
import { Button } from "@/components/ui/button";

type AssetManageButtonsProps = {
  asset: AiMediaAsset;
  layout?: "card" | "dialog";
};

export function AssetManageButtons({
  asset,
  layout = "card",
}: AssetManageButtonsProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState<
    "archive" | "delete" | "restore" | null
  >(null);

  const isDraft = asset.status === "draft";
  const isPublished = asset.status === "published";
  const isArchived = asset.status === "archived";
  const size = layout === "dialog" ? "default" : "sm";
  const fullWidth = layout === "dialog";

  async function runAction(
    kind: "archive" | "delete" | "restore",
    action: () => Promise<unknown>
  ) {
    setPending(kind);
    try {
      await action();
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "הפעולה נכשלה");
    } finally {
      setPending(null);
    }
  }

  async function handleArchive() {
    const message = isPublished
      ? "להעביר לארכיון? הנכס יוסר מהרשימה הפעילה אך יישמר לשחזור."
      : "להעביר את הנכס לארכיון?";
    if (!window.confirm(message)) return;

    await runAction("archive", () => archiveMediaAsset(asset.id));
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "למחוק את הנכס לצמיתות? לא ניתן לשחזר לאחר המחיקה."
      )
    ) {
      return;
    }

    await runAction("delete", () => deleteMediaAsset(asset.id));
  }

  async function handleRestoreFromArchive() {
    await runAction("restore", () => restoreAssetFromArchive(asset.id));
  }

  return (
    <div
      className={
        fullWidth
          ? "flex flex-col gap-2"
          : "flex flex-wrap gap-2"
      }
    >
      {isArchived && (
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={pending !== null}
          onClick={handleRestoreFromArchive}
          className={`rounded-none text-xs font-light ${fullWidth ? "w-full" : ""}`}
        >
          {pending === "restore" ? (
            <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
          )}
          שחזור מארכיון
        </Button>
      )}

      {(isDraft || isPublished) && (
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={pending !== null}
          onClick={handleArchive}
          className={`rounded-none text-xs font-light ${fullWidth ? "w-full" : ""}`}
        >
          {pending === "archive" ? (
            <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Archive className="ml-1.5 h-3.5 w-3.5" />
          )}
          העברה לארכיון
        </Button>
      )}

      {(isDraft || isArchived) && (
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={pending !== null}
          onClick={handleDelete}
          className={`rounded-none text-xs font-light text-destructive hover:text-destructive ${fullWidth ? "w-full" : ""}`}
        >
          {pending === "delete" ? (
            <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="ml-1.5 h-3.5 w-3.5" />
          )}
          מחיקה לצמיתות
        </Button>
      )}
    </div>
  );
}
