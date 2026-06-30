"use client";

import * as React from "react";
import { Loader2, Trash2 } from "lucide-react";

import {
  deleteMediaAsset,
  updateMediaAsset,
} from "@/app/(workspace)/workspace/content-library/actions";
import type { AiMediaAsset } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditMediaAssetDialogProps = {
  asset: AiMediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

export function EditMediaAssetDialog({
  asset,
  open,
  onOpenChange,
  onUpdated,
}: EditMediaAssetDialogProps) {
  const [title, setTitle] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (asset) {
      setTitle(asset.title ?? "");
      setError(null);
    }
  }, [asset]);

  async function handleSave() {
    if (!asset) return;
    setPending(true);
    setError(null);
    try {
      await updateMediaAsset(asset.id, { title: title.trim() || null });
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "העדכון נכשל");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;
    if (!window.confirm("למחוק את הנכס מהספרייה?")) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteMediaAsset(asset.id);
      onUpdated();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "המחיקה נכשלה");
    } finally {
      setDeleting(false);
    }
  }

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none sm:max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle className="font-serif text-xl font-light">
            עריכת נכס
          </DialogTitle>
          <DialogDescription className="font-light">
            נכס #{asset.id} ·{" "}
            {asset.mediaType === "video" ? "וידאו" : "תמונה"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="asset-title" className="font-light">
              שם לזיהוי בספרייה
            </Label>
            <Input
              id="asset-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: עגילים על רקע כהה"
              className="rounded-none"
            />
          </div>

          {error && (
            <p className="text-sm font-light text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            onClick={handleSave}
            disabled={pending || deleting}
            className="w-full rounded-none text-xs font-light tracking-[0.12em]"
          >
            {pending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : null}
            שמירת שינויים
          </Button>

          {asset.status === "draft" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={pending || deleting}
              className="w-full rounded-none text-xs font-light tracking-[0.12em] text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="ml-2 h-4 w-4" strokeWidth={1.5} />
              )}
              מחיקה מהספרייה
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
