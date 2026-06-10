"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { sendCampaign } from "@/app/(workspace)/workspace/marketing/actions";
import { Button } from "@/components/ui/button";

export function SendCampaignButton({
  id,
  title,
}: {
  id: number;
  title: string;
}) {
  const [isPending, startTransition] = React.useTransition();
  const [sentTo, setSentTo] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function handleSend() {
    if (!window.confirm(`לשלוח את "${title}" לכל הלקוחות עכשיו?`)) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await sendCampaign(id);
        setSentTo(result.sentTo);
      } catch (e) {
        setError(e instanceof Error ? e.message : "השליחה נכשלה");
      }
    });
  }

  if (sentTo !== null) {
    return (
      <span className="flex items-center justify-end gap-1.5 text-xs font-light text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        נשלח ל־{sentTo} לקוחות
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleSend}
        className="rounded-none border-foreground/30 text-[11px] font-light tracking-[0.1em] hover:bg-foreground hover:text-background"
      >
        {isPending ? (
          <>
            <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
            שולח...
          </>
        ) : (
          <>
            <Send className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
            שלח עכשיו לכולם
          </>
        )}
      </Button>
      {error && (
        <span className="text-[11px] font-light text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
