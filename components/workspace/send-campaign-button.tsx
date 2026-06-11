"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

import { sendCampaign } from "@/app/(workspace)/workspace/marketing/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
      <ConfirmDialog
        title="שליחת קמפיין"
        description={`לסמן את "${title}" כנשלח? (סימולציה — דיוור בפועל יחובר בהמשך ל-Resend)`}
        confirmLabel="סימון כנשלח"
        onConfirm={handleSend}
        trigger={
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            className="rounded-none border-foreground/30 text-[11px] font-light tracking-[0.1em] hover:bg-foreground hover:text-background"
          >
            {isPending ? (
              <>
                <Loader2 aria-hidden className="ml-1.5 h-3.5 w-3.5 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send aria-hidden className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                סימון כנשלח
              </>
            )}
          </Button>
        }
      />
      {error && (
        <span role="alert" className="text-[11px] font-light text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
