import Image from "next/image";
import Link from "next/link";
import { desc } from "drizzle-orm";
import {
  ArrowLeft,
  BadgePercent,
  ChevronDown,
  Gem,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { getSiteSettings, type SiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";

// הדף מציג מלאי והגדרות חיים מהדאטהבייס — נטען בזמן בקשה
export const dynamic = "force-dynamic";

const TRUST_FEATURES = [
  {
    icon: Gem,
    title: "ללא מתווכים",
    text: "ישירות מהיצרן לצרכן",
  },
  {
    icon: ShieldCheck,
    title: "אמינות ושקיפות",
    text: "כולל אחריות מלאה ותעודה גימולוגית",
  },
  {
    icon: Truck,
    title: "שירות VIP",
    text: "שירות אישי עד בית הלקוח",
  },
  {
    icon: BadgePercent,
    title: "מחירים ללא תחרות",
    text: "באיכות הגבוהה ביותר, כי אתם קונים מיד ראשונה",
  },
];

function categoriesFromSettings(s: SiteSettings) {
  return [
    { name: s.categoryRingsTitle, image: s.categoryRingsImage, href: "/collections/rings" },
    { name: s.categoryBraceletsTitle, image: s.categoryBraceletsImage, href: "/collections/bracelets" },
    { name: s.categoryNecklacesTitle, image: s.categoryNecklacesImage, href: "/collections/necklaces" },
    { name: s.categoryCustomTitle, image: s.categoryCustomImage, href: "/collections/custom" },
  ];
}

/** כותרת סקציה אחידה: שורת פתיח, כותרת סריף, קו זהב קצר */
function SectionHeading({
  eyebrow,
  title,
  dark,
}: {
  eyebrow: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <div className="fade-up text-center">
      <p
        className={
          dark
            ? "text-[11px] tracking-[0.3em] text-gold-light"
            : "text-[11px] tracking-[0.3em] text-gold-dark"
        }
      >
        {eyebrow}
      </p>
      <h2
        className={
          "mt-3 font-serif text-3xl font-medium tracking-wide sm:text-4xl " +
          (dark ? "text-ivory" : "text-foreground")
        }
      >
        {title}
      </h2>
      <span className="mx-auto mt-5 block h-px w-16 bg-gold" />
    </div>
  );
}

export default async function HomePage() {
  const [settings, featuredProducts] = await Promise.all([
    getSiteSettings(),
    db.select().from(products).orderBy(desc(products.createdAt)).limit(12),
  ]);

  const categories = categoriesFromSettings(settings);

  return (
    <>
      {/* 1. Hero — מבטל את ה-padding של ה-layout ויושב מאחורי ה-header */}
      <section className="relative -mt-[104px] flex min-h-screen flex-col items-center justify-center overflow-hidden bg-charcoal px-4 text-center">
        {/* תמונת רקע */}
        {settings.heroImage ? (
          <Image
            src={settings.heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,154,94,0.18),transparent_55%)]"
          />
        )}
        {/* שכבת כהות לקריאות */}
        <div aria-hidden className="absolute inset-0 bg-black/50" />

        <div className="relative max-w-4xl">
          <p className="text-xs font-light tracking-[0.35em] text-gold-light">
            {settings.heroBadge}
          </p>

          <h1 className="mt-8 font-serif text-4xl font-medium leading-[1.15] tracking-wide text-ivory sm:text-6xl lg:text-7xl">
            {settings.heroTitle}
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-sm font-light leading-relaxed text-ivory/85 sm:text-base">
            {settings.heroSubtitle}
          </p>

          <Button
            asChild
            className="group mt-12 rounded-none border border-gold bg-transparent px-12 py-6 text-xs font-normal tracking-[0.25em] text-gold-light shadow-none transition-all duration-300 hover:bg-gold hover:text-charcoal"
          >
            <Link href="/collections/rings">
              לכל הקולקציות
              <ArrowLeft
                className="mr-3 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          </Button>
        </div>

        {/* אינדיקטור גלילה */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-gold/80" strokeWidth={1.25} />
        </div>
      </section>

      {/* 2. מבצעים נבחרים */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <SectionHeading
          eyebrow={settings.featuredSubtitle}
          title={settings.featuredTitle}
        />

        {featuredProducts.length === 0 ? (
          <div className="fade-up mt-14 flex flex-col items-center gap-4 py-12 text-center">
            <Gem
              aria-hidden
              className="h-10 w-10 text-gold/60"
              strokeWidth={0.75}
            />
            <p className="text-sm font-light text-muted-foreground">
              הקולקציה מתעדכנת בימים אלה — נשמח לראותכם בקרוב
            </p>
          </div>
        ) : (
          <div className="fade-up mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:grid-cols-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="w-[46vw] shrink-0 snap-start sm:w-auto"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. הקולקציות שלנו */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <SectionHeading eyebrow="עולם של יופי" title="הקולקציות שלנו" />

          <div className="fade-up mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group relative block aspect-[4/5] overflow-hidden"
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-charcoal via-stone-700 to-stone-500 transition-transform duration-700 ease-out group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-colors duration-500 group-hover:from-black/85" />

                <div className="relative flex h-full flex-col items-center justify-end pb-10 text-center">
                  <h3 className="font-serif text-2xl font-medium tracking-[0.1em] text-ivory">
                    {category.name}
                  </h3>
                  <span className="mt-3 border-b border-gold/0 pb-0.5 text-[11px] font-light tracking-[0.25em] text-gold-light transition-colors duration-300 group-hover:border-gold">
                    לצפייה בקולקציה
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. אמון ושירות — על רקע פחם */}
      <section className="bg-charcoal text-ivory">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <div className="fade-up grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_FEATURES.map((feature) => (
              <div key={feature.title} className="text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40">
                  <feature.icon
                    aria-hidden
                    className="h-6 w-6 text-gold"
                    strokeWidth={1}
                  />
                </span>
                <h3 className="mt-6 text-sm font-medium tracking-[0.12em] text-ivory">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-ivory/65">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. הסיפור שלנו */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* טקסט */}
          <div className="fade-up">
            <p className="font-serif text-2xl font-medium leading-snug text-gold-dark sm:text-3xl">
              ”{settings.aboutQuote}“
            </p>

            <h2 className="mt-8 font-serif text-3xl font-medium leading-snug tracking-wide sm:text-4xl">
              {settings.aboutTitle}
            </h2>

            <div className="mt-8 space-y-5 border-r-2 border-gold/40 pr-6 text-sm font-light leading-relaxed text-foreground/80 sm:text-base">
              <p>{settings.aboutParagraph1}</p>
              <p>{settings.aboutParagraph2}</p>
              <p>{settings.aboutParagraph3}</p>
            </div>
          </div>

          {/* תמונה */}
          <div className="fade-up relative aspect-[4/5] overflow-hidden">
            {settings.aboutImage ? (
              <Image
                src={settings.aboutImage}
                alt={settings.aboutTitle}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-charcoal text-gold/70">
                <Gem aria-hidden className="h-12 w-12" strokeWidth={0.5} />
                <p className="text-[11px] font-light tracking-[0.3em]">
                  מהגלם ועד היצירה
                </p>
              </div>
            )}
            {/* מסגרת זהב פנימית עדינה */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-3 border border-gold/40"
            />
          </div>
        </div>
      </section>

      {/* 6. יצירת קשר */}
      <section className="border-t border-gold/25 bg-secondary/50">
        <div className="fade-up mx-auto max-w-7xl px-4 py-24 text-center sm:px-8">
          <SectionHeading eyebrow="נשמח לארח אתכם" title="יצירת קשר" />

          {/* טלפון — בולט במיוחד */}
          <a
            href={`tel:${settings.contactPhone}`}
            className="mt-12 inline-block font-serif text-4xl font-medium tracking-wider text-gold-dark transition-colors hover:text-gold sm:text-6xl"
            dir="ltr"
          >
            {settings.contactPhone}
          </a>

          {/* כפתורי פעולה */}
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

          {/* סניפים */}
          <div className="mx-auto mt-14 flex max-w-3xl flex-col items-center justify-center gap-5 sm:flex-row sm:gap-12">
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
        </div>
      </section>
    </>
  );
}
