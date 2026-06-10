import { Users } from "lucide-react";

import { ImportCustomersZone } from "@/components/workspace/import-customers-zone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCustomers } from "./actions";

export const metadata = { title: "ניהול לקוחות" };

// העמוד קורא מהדאטהבייס — חייב להירנדר בכל בקשה
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-8">
      {/* כותרת ופעולות */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-light tracking-wide">
            ניהול לקוחות (CRM)
          </h1>
          <p className="mt-2 text-sm font-light text-muted-foreground">
            {customers.length > 0
              ? `${customers.length} לקוחות רשומים`
              : "ניהול קהל הלקוחות של החנות"}
          </p>
        </div>
        <ImportCustomersZone />
      </div>

      {/* טבלת לקוחות */}
      <div className="border border-border/60 bg-background">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Users
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">
                אין עדיין לקוחות
              </p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                ייבאו את רשימת הלקוחות הראשונה שלכם מקובץ CSV
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">
                  שם מלא
                </TableHead>
                <TableHead className="text-right font-light">אימייל</TableHead>
                <TableHead className="text-right font-light">טלפון</TableHead>
                <TableHead className="text-right font-light">
                  תאריך הצטרפות
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    {customer.fullName}
                  </TableCell>
                  <TableCell className="font-light" dir="ltr">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell className="font-light tabular-nums" dir="ltr">
                    {customer.phone ?? "—"}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(customer.createdAt)}
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
