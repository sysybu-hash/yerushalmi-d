import { Mail, Megaphone, MessageSquareText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CampaignPreviewDialog } from "@/components/workspace/campaign-preview-dialog";
import { CreateCampaignSheet } from "@/components/workspace/create-campaign-sheet";
import { DeleteCampaignButton } from "@/components/workspace/delete-campaign-button";
import { EditCampaignSheet } from "@/components/workspace/edit-campaign-sheet";
import { SendCampaignButton } from "@/components/workspace/send-campaign-button";
import { getCampaigns } from "./actions";

export const metadata = { title: "שיווק ודיוור" };

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function MarketingPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            מערכת שיווק ודיוור לקוחות
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {campaigns.length > 0
              ? `${campaigns.length} קמפיינים במערכת`
              : "עדכנו את הלקוחות על מבצעים ותכשיטים חדשים"}
          </p>
          <p className="mt-1 text-xs font-light text-muted-foreground/80">
            שליחה בפועל תתחבר בהמשך ל-Resend (אימייל) או ספק SMS — כרגע נשמר
            כטיוטה ומסומן כנשלח לצורך בדיקה.
          </p>
        </div>
        <CreateCampaignSheet />
      </div>

      <div className="border border-border/60 bg-background">
        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Megaphone
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">
                אין עדיין קמפיינים
              </p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                צרו קמפיין ראשון ושלחו אותו לכל הלקוחות בלחיצה
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">
                  שם הקמפיין
                </TableHead>
                <TableHead className="text-right font-light">ערוץ</TableHead>
                <TableHead className="text-right font-light">סטטוס</TableHead>
                <TableHead className="text-right font-light">
                  תאריך יצירה
                </TableHead>
                <TableHead className="text-left font-light">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <p className="font-medium">{campaign.title}</p>
                    <p className="mt-0.5 max-w-md truncate text-xs font-light text-muted-foreground">
                      {campaign.content}
                    </p>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm font-light">
                      {campaign.type === "email" ? (
                        <>
                          <Mail
                            className="h-3.5 w-3.5 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          אימייל
                        </>
                      ) : (
                        <>
                          <MessageSquareText
                            className="h-3.5 w-3.5 text-muted-foreground"
                            strokeWidth={1.5}
                          />
                          SMS
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    {campaign.status === "sent" ? (
                      <Badge className="rounded-none bg-emerald-700 font-light hover:bg-emerald-700">
                        נשלח
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-none border-foreground/30 font-light"
                      >
                        טיוטה
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(campaign.createdAt)}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center justify-end gap-1">
                      <CampaignPreviewDialog campaign={campaign} />
                      {campaign.status === "draft" && (
                        <>
                          <EditCampaignSheet campaign={campaign} />
                          <DeleteCampaignButton
                            id={campaign.id}
                            title={campaign.title}
                          />
                          <SendCampaignButton
                            id={campaign.id}
                            title={campaign.title}
                          />
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
