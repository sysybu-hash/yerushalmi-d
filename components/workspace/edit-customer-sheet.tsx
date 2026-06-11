"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Pencil } from "lucide-react";

import { updateCustomer } from "@/app/(workspace)/workspace/customers/actions";
import type { Customer } from "@/db/schema";
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
        "שמירת שינויים"
      )}
    </Button>
  );
}

export function EditCustomerSheet({ customer }: { customer: Customer }) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await updateCustomer(customer.id, formData);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "השמירה נכשלה");
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`עריכת ${customer.fullName}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            עריכת לקוח
          </SheetTitle>
          <SheetDescription className="font-light">
            עדכון פרטי {customer.fullName}
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`full_name-${customer.id}`} className="font-light">
              שם מלא *
            </Label>
            <Input
              id={`full_name-${customer.id}`}
              name="full_name"
              required
              defaultValue={customer.fullName}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`email-${customer.id}`} className="font-light">
              אימייל
            </Label>
            <Input
              id={`email-${customer.id}`}
              name="email"
              type="email"
              dir="ltr"
              defaultValue={customer.email ?? ""}
              className="rounded-none text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`phone-${customer.id}`} className="font-light">
              טלפון
            </Label>
            <Input
              id={`phone-${customer.id}`}
              name="phone"
              type="tel"
              dir="ltr"
              defaultValue={customer.phone ?? ""}
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
