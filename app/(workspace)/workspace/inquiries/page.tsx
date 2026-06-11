import { MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ResolveInquiryButton } from "@/components/workspace/resolve-inquiry-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInquiries } from "./actions";

export const metadata = { title: "פניות לקוחות" };

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function InquiriesPage() {
  const inquiries = await getInquiries();
  const pendingCount = inquiries.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">
          פניות לקוחות
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          {inquiries.length > 0
            ? `${inquiries.length} פניות · ${pendingCount} ממתינות לטיפול`
            : "פניות מטופס יצירת הקשר בחנות"}
        </p>
      </div>

      <div className="border border-border/60 bg-background">
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <MessageSquare
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">אין פניות עדיין</p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                פניות מטופס צור קשר יופיעו כאן
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">שם</TableHead>
                <TableHead className="text-right font-light">טלפון</TableHead>
                <TableHead className="text-right font-light">נושא</TableHead>
                <TableHead className="text-right font-light">הודעה</TableHead>
                <TableHead className="text-right font-light">תאריך</TableHead>
                <TableHead className="text-right font-light">סטטוס</TableHead>
                <TableHead className="text-left font-light">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">
                    {inquiry.fullName}
                  </TableCell>
                  <TableCell className="font-light tabular-nums" dir="ltr">
                    {inquiry.phone}
                  </TableCell>
                  <TableCell className="font-light">
                    {inquiry.subject ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-xs font-light">
                    <p className="line-clamp-2">{inquiry.message}</p>
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(inquiry.createdAt)}
                  </TableCell>
                  <TableCell>
                    {inquiry.status === "resolved" ? (
                      <Badge className="rounded-none bg-emerald-700 font-light hover:bg-emerald-700">
                        טופל
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="rounded-none border-foreground/30 font-light"
                      >
                        ממתין
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-left">
                    {inquiry.status === "pending" && (
                      <ResolveInquiryButton id={inquiry.id} />
                    )}
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
