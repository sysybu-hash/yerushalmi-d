"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import { createCustomer } from "@/app/(workspace)/workspace/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-none text-xs font-light tracking-[0.15em]"
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        "הוספת לקוח"
      )}
    </Button>
  );
}

export function AddCustomerSheet() {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await createCustomer(formData);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "ההוספה נכשלה");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-none text-xs font-light tracking-[0.15em]">
          <Plus className="ml-2 h-4 w-4" strokeWidth={1.5} />
          לקוח חדש
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            לקוח חדש
          </SheetTitle>
          <SheetDescription className="font-light">
            הוספת לקוח/ה לרשימת ה-CRM
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="font-light">
              שם מלא *
            </Label>
            <Input
              id="full_name"
              name="full_name"
              required
              placeholder="שם פרטי ומשפחה"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-light">
              אימייל
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              placeholder="name@example.com"
              className="rounded-none text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-light">
              טלפון
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              dir="ltr"
              placeholder="050-0000000"
              className="rounded-none text-right"
            />
          </div>

          {error && (
            <p className="text-sm font-light text-destructive">{error}</p>
          )}

          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
