"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { updateAdminNotes } from "@/app/(workspace)/workspace/orders/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      variant="outline"
      className="rounded-none text-[11px] font-light tracking-[0.1em]"
    >
      {pending ? (
        <>
          <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" />
          שומר...
        </>
      ) : (
        "שמירת הערות"
      )}
    </Button>
  );
}

export function OrderAdminNotesForm({
  orderId,
  defaultNotes,
}: {
  orderId: number;
  defaultNotes: string | null;
}) {
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    await updateAdminNotes(orderId, formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <Label htmlFor={`admin_notes-${orderId}`} className="font-light">
        הערות מנהל (פנימי)
      </Label>
      <Textarea
        id={`admin_notes-${orderId}`}
        name="admin_notes"
        rows={3}
        defaultValue={defaultNotes ?? ""}
        placeholder="הערות פנימיות לצוות..."
        className="rounded-none resize-none text-sm"
      />
      <div className="flex items-center gap-3">
        <SubmitButton />
        {saved && (
          <span className="text-xs font-light text-emerald-600">נשמר</span>
        )}
      </div>
    </form>
  );
}
