"use client";

import { Eye, Mail, MessageSquareText } from "lucide-react";

import type { Campaign } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CampaignPreviewDialog({ campaign }: { campaign: Campaign }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`תצוגה מקדימה — ${campaign.title}`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="max-w-lg rounded-none">
        <DialogHeader className="text-right">
          <DialogTitle className="font-serif text-xl font-light tracking-wide">
            {campaign.title}
          </DialogTitle>
          <DialogDescription className="font-light">
            תצוגה מקדימה של הקמפיין
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-none font-light">
            {campaign.type === "email" ? (
              <>
                <Mail className="ml-1 h-3 w-3" />
                אימייל
              </>
            ) : (
              <>
                <MessageSquareText className="ml-1 h-3 w-3" />
                SMS
              </>
            )}
          </Badge>
          <Badge
            variant="outline"
            className="rounded-none border-foreground/30 font-light"
          >
            {campaign.status === "sent" ? "נשלח" : "טיוטה"}
          </Badge>
        </div>

        <div className="mt-4 border border-border/60 bg-muted/20 p-4">
          <p className="whitespace-pre-wrap text-sm font-light leading-relaxed">
            {campaign.content}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
