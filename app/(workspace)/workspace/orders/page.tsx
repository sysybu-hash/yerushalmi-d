import { Suspense } from "react";
import { ClipboardList } from "lucide-react";

import { OrderItemsDialog } from "@/components/workspace/order-items-dialog";
import { OrderStatusSelect } from "@/components/workspace/order-status-select";
import { OrdersToolbar } from "@/components/workspace/orders-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "./actions";

export const metadata = { title: "ניהול הזמנות" };

export const dynamic = "force-dynamic";

const priceFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type OrdersPageProps = {
  searchParams: { q?: string; status?: string };
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const orders = await getOrders({
    q: searchParams.q,
    status: searchParams.status,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">
          ניהול הזמנות
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          {orders.length > 0
            ? `${orders.length} הזמנות במערכת`
            : "מעקב אחר הזמנות שנכנסו מהחנות"}
        </p>
      </div>

      <Suspense fallback={null}>
        <OrdersToolbar />
      </Suspense>

      <div className="border border-border/60 bg-background">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <ClipboardList
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <div>
              <p className="font-serif text-xl font-light">
                אין הזמנות להצגה
              </p>
              <p className="mt-1 text-sm font-light text-muted-foreground">
                הזמנות שלקוחות יבצעו בחנות יופיעו כאן
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-light">
                  מספר הזמנה
                </TableHead>
                <TableHead className="text-right font-light">לקוח</TableHead>
                <TableHead className="text-right font-light">תאריך</TableHead>
                <TableHead className="text-right font-light">
                  סכום כולל
                </TableHead>
                <TableHead className="text-right font-light">סטטוס</TableHead>
                <TableHead className="text-left font-light">פירוט</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium tabular-nums">
                    #{order.id}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{order.customerName}</p>
                    <p
                      className="mt-0.5 text-xs font-light text-muted-foreground"
                      dir="ltr"
                    >
                      {order.customerPhone}
                    </p>
                    {order.customerEmail && (
                      <p
                        className="text-xs font-light text-muted-foreground"
                        dir="ltr"
                      >
                        {order.customerEmail}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {dateFormatter.format(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-light tabular-nums">
                    {priceFormatter.format(Number(order.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect
                      orderId={order.id}
                      status={order.status}
                    />
                  </TableCell>
                  <TableCell className="text-left">
                    <OrderItemsDialog order={order} items={order.items} />
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
