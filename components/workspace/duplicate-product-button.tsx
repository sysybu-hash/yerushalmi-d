"use client";

import * as React from "react";
import { Copy, Loader2 } from "lucide-react";

import { duplicateProduct } from "@/app/(workspace)/workspace/products/actions";
import { Button } from "@/components/ui/button";

export function DuplicateProductButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [isPending, startTransition] = React.useTransition();

  function handleDuplicate() {
    startTransition(async () => {
      await duplicateProduct(id);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`שכפול ${title}`}
      disabled={isPending}
      onClick={handleDuplicate}
      className="text-muted-foreground hover:text-foreground"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Copy className="h-4 w-4" strokeWidth={1.5} />
      )}
    </Button>
  );
}
