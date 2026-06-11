"use client";

import * as React from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { submitInquiry } from "@/app/(storefront)/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [isPending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      try {
        await submitInquiry(formData);
        setSuccess(true);
        form.reset();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "שליחת הפנייה נכשלה — נסו שוב"
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-14 max-w-lg space-y-5 text-right">
      <h2 className="font-serif text-2xl font-light tracking-wide">
        שלחו לנו הודעה
      </h2>

      <div className="space-y-2">
        <Label htmlFor="full_name" className="font-light">
          שם מלא *
        </Label>
        <Input
          id="full_name"
          name="full_name"
          required
          className="rounded-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="font-light">
          טלפון *
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          dir="ltr"
          className="rounded-none text-right"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="font-light">
          נושא
        </Label>
        <Input id="subject" name="subject" className="rounded-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="font-light">
          הודעה *
        </Label>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          className="rounded-none resize-none"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs font-light text-destructive"
        >
          <XCircle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs font-light text-emerald-700"
        >
          <CheckCircle2 aria-hidden className="h-3.5 w-3.5 shrink-0" />
          הפנייה נשלחה בהצלחה — נחזור אליכם בהקדם
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-none bg-charcoal text-xs font-normal tracking-[0.2em] text-ivory hover:bg-gold-dark"
      >
        {isPending ? (
          <>
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            שולח...
          </>
        ) : (
          "שליחת פנייה"
        )}
      </Button>
    </form>
  );
}
