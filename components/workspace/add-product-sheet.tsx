"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";

import { addProduct } from "@/app/(workspace)/workspace/products/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
} from "@/components/workspace/product-constants";

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
        "הוספת תכשיט"
      )}
    </Button>
  );
}

export function AddProductSheet() {
  const [open, setOpen] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    await addProduct(formData);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-none text-xs font-light tracking-[0.15em]">
          <Plus className="ml-2 h-4 w-4" strokeWidth={1.5} />
          תכשיט חדש
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            תכשיט חדש
          </SheetTitle>
          <SheetDescription className="font-light">
            הוספת פריט חדש למלאי החנות
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-light">
              שם המוצר *
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="לדוגמה: טבעת סוליטר 1.5 קראט"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-light">
              תיאור
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="תיאור המוצר שיוצג בחנות..."
              className="rounded-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="font-light">
              מחיר (₪) *
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-light">סוג יהלום *</Label>
            <Select name="type" required dir="rtl" defaultValue="natural">
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת סוג" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-light">קטגוריה *</Label>
            <Select name="category" required dir="rtl">
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
