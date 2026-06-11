"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Pencil } from "lucide-react";

import { updateCampaign } from "@/app/(workspace)/workspace/marketing/actions";
import type { Campaign } from "@/db/schema";
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
          שומר...
        </>
      ) : (
        "שמירת שינויים"
      )}
    </Button>
  );
}

export function EditCampaignSheet({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    try {
      await updateCampaign(campaign.id, formData);
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
          aria-label={`עריכת ${campaign.title}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="font-serif text-2xl font-light tracking-wide">
            עריכת קמפיין
          </SheetTitle>
          <SheetDescription className="font-light">
            עדכון טיוטת הקמפיין
          </SheetDescription>
        </SheetHeader>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`title-${campaign.id}`} className="font-light">
              שם הקמפיין *
            </Label>
            <Input
              id={`title-${campaign.id}`}
              name="title"
              required
              defaultValue={campaign.title}
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-light">ערוץ דיוור *</Label>
            <Select
              name="type"
              required
              dir="rtl"
              defaultValue={campaign.type}
            >
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
            <Label htmlFor={`content-${campaign.id}`} className="font-light">
              תוכן ההודעה *
            </Label>
            <Textarea
              id={`content-${campaign.id}`}
              name="content"
              required
              rows={7}
              defaultValue={campaign.content}
              className="rounded-none resize-none"
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
