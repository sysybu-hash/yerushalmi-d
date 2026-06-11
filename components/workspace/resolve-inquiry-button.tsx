"use client";

import * as React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { resolveInquiry } from "@/app/(workspace)/workspace/inquiries/actions";
import { Button } from "@/components/ui/button";

export function ResolveInquiryButton({ id }: { id: number }) {
  const [isPending, startTransition] = React.useTransition();
  const [resolved, setResolved] = React.useState(false);

  function handleResolve() {
    startTransition(async () => {
      await resolveInquiry(id);
      setResolved(true);
    });
  }

  if (resolved) {
    return (
      <span className="flex items-center justify-end gap-1.5 text-xs font-light text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        טופל
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleResolve}
      className="rounded-none border-foreground/30 text-[11px] font-light tracking-[0.1em] hover:bg-foreground hover:text-background"
    >
      {isPending ? (
        <>
          <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          מעדכן...
        </>
      ) : (
        "סימון כטופל"
      )}
    </Button>
  );
}
