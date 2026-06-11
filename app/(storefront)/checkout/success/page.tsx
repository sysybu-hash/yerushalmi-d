import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "ההזמנה התקבלה" };

type SuccessPageProps = {
  searchParams: { order?: string };
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const settings = await getSiteSettings();
  const orderId = searchParams.order?.trim();

  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <CheckCircle2
        className="h-12 w-12 text-emerald-600"
        strokeWidth={0.75}
      />
      <h1 className="mt-6 font-serif text-3xl font-light tracking-wide sm:text-4xl">
        תודה! ההזמנה התקבלה
      </h1>

      {orderId && (
        <p className="mt-4 font-serif text-lg tracking-wide text-gold-dark">
          מספר הזמנה: #{orderId}
        </p>
      )}

      <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-muted-foreground">
        נציג מטעמנו ייצור עמכם קשר בהקדם לתיאום התשלום והמשלוח.
        <br />
        מספר הטלפון שלנו תמיד פתוח עבורכם:{" "}
        <a
          href={`tel:${settings.contactPhone}`}
          className="underline"
          dir="ltr"
        >
          {settings.contactPhone}
        </a>
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          variant="outline"
          className="rounded-none border-foreground/40 px-8 text-xs font-light tracking-[0.15em]"
        >
          <a
            href={`https://wa.me/${settings.contactWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="ml-2 h-4 w-4" strokeWidth={1.5} />
            שליחת הודעה בוואטסאפ
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="rounded-none border-foreground/40 px-8 text-xs font-light tracking-[0.15em] hover:bg-foreground hover:text-background"
        >
          <Link href="/">חזרה לחנות</Link>
        </Button>
      </div>
    </section>
  );
}
