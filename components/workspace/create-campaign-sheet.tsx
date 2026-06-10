"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Megaphone, Plus } from "lucide-react";

import { createCampaign } from "@/app/(workspace)/workspace/marketing/actions";
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
          שומר טיוטה...
        </>
      ) : (
        <>
          <Megaphone className="ml-2 h-4 w-4" strokeWidth={1.5} />
          שמירת קמפיין כטיוטה
        </>
      )}
    </Button>
  );
}

export function CreateCampaignSheet() {
  const [open, setOpen] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    await createCampaign(formData);
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="rounded-none text-xs font-light tracking-[0.15em]">
          <Plus className="ml-2 h-4 w-4" strokeWidth={1.5} />
          קמפיין חדש
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            קמפיין חדש
          </SheetTitle>
          <SheetDescription className="font-light">
            הקמפיין יישמר כטיוטה — השליחה מתבצעת מהטבלה
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-light">
              שם הקמפיין *
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="לדוגמה: מבצע חגים — 20% על טבעות"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-light">ערוץ דיוור *</Label>
            <Select name="type" required dir="rtl" defaultValue="email">
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="בחירת ערוץ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">אימייל</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="font-light">
              תוכן ההודעה *
            </Label>
            <Textarea
              id="content"
              name="content"
              required
              rows={7}
              placeholder="לקוחות יקרים, לרגל החגים אנו שמחים להעניק לכם..."
              className="rounded-none resize-none"
            />
          </div>

          <SubmitButton />
        </form>
      </SheetContent>
    </Sheet>
  );
}
