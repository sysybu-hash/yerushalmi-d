import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/storefront/contact-form";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "צור קשר" };

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="relative -mt-[104px] flex min-h-[40vh] flex-col items-center justify-center bg-charcoal px-4 pt-[104px] text-center">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,154,94,0.18),transparent_55%)]"
        />
        <div className="relative">
          <p className="text-[11px] tracking-[0.3em] text-gold-light">
            נשמח לארח אתכם
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-wide text-ivory sm:text-5xl">
            יצירת קשר
          </h1>
          <span className="mx-auto mt-6 block h-px w-16 bg-gold" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-8">
        <a
          href={`tel:${settings.contactPhone}`}
          className="inline-block font-serif text-4xl font-medium tracking-wider text-gold-dark transition-colors hover:text-gold sm:text-5xl"
          dir="ltr"
        >
          {settings.contactPhone}
        </a>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            asChild
            className="rounded-none bg-charcoal px-8 text-xs font-normal tracking-[0.2em] text-ivory hover:bg-gold-dark"
          >
            <a href={`tel:${settings.contactPhone}`}>
              <Phone className="ml-2 h-4 w-4" strokeWidth={1.5} />
              חיוג מיידי
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-none border-gold px-8 text-xs font-normal tracking-[0.2em] text-gold-dark hover:bg-gold hover:text-charcoal"
          >
            <a
              href={`https://wa.me/${settings.contactWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="ml-2 h-4 w-4" strokeWidth={1.5} />
              WhatsApp
            </a>
          </Button>
        </div>

        <div className="mx-auto mt-14 flex max-w-2xl flex-col items-center justify-center gap-5 sm:flex-row sm:gap-12">
          <div className="flex items-center gap-2 text-sm font-light text-foreground/80">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-gold-dark"
              strokeWidth={1.25}
            />
            <span>{settings.contactLocation1}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-light text-foreground/80">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-gold-dark"
              strokeWidth={1.25}
            />
            <span>{settings.contactLocation2}</span>
          </div>
        </div>

        <p className="mt-12 text-sm font-light leading-relaxed text-muted-foreground">
          {settings.contactNote}
        </p>

        <ContactForm />

        <Button
          asChild
          variant="ghost"
          className="mt-10 rounded-none text-xs font-light tracking-[0.15em] text-muted-foreground"
        >
          <Link href="/">← חזרה לחנות</Link>
        </Button>
      </section>
    </>
  );
}
