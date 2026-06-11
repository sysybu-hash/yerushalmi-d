"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmDialogProps = {
  /** האלמנט שלוחצים עליו כדי לפתוח את הדיאלוג (asChild) */
  trigger: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * דיאלוג אישור מעוצב — מחליף את window.confirm.
 * נגיש: מלכודת פוקוס, סגירה ב-Esc, וכותרת מתויגת (Radix Dialog).
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md rounded-none text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="font-serif text-xl font-medium tracking-wide">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="pt-1 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className="rounded-none text-xs tracking-[0.1em]"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-none text-xs tracking-[0.1em]"
            >
              {cancelLabel}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
