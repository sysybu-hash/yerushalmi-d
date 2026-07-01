import Image from "next/image";
import Link from "next/link";
import { and, desc, inArray, isNotNull, sql } from "drizzle-orm";
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
import { getSiteSettings } from "@/lib/site-settings";
import { homepageCategories, collectionLabel, STOREFRONT_CATALOG_SLUGS } from "@/lib/categories";
import { SITE_HEADER_NEGATIVE_OFFSET_CLASS } from "@/lib/site-layout";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/storefront/product-card";
import {
  ProductCarousel,
  ProductCarouselItem,
} from "@/components/storefront/product-carousel";

// הדף מציג מלאי והגדרות חיים מהדאטהבייס — נטען בזמן בקשה
export const dynamic = "force-dynamic";

const TRUST_ICONS = [Gem, ShieldCheck, Truck, BadgePercent] as const;

function trustFeatures(settings: Awaited<ReturnType<typeof getSiteSettings>>) {
  return ([1, 2, 3, 4] as const).map((n, i) => ({
    icon: TRUST_ICONS[i] ?? Gem,
    title: settings[`trust${n}Title` as keyof typeof settings],
    text: settings[`trust${n}Text` as keyof typeof settings],
  }));
}

function categoriesFromSettings(s: Awaited<ReturnType<typeof getSiteSettings>>) {
  return homepageCategories(s);
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
  const [settings, featuredProducts, catalogProducts] = await Promise.all([
    getSiteSettings(),
    db
      .select()
      .from(products)
      .where(
        and(
          isNotNull(products.originalPrice),
          sql`${products.originalPrice}::numeric > ${products.price}::numeric`
        )
      )
      .orderBy(desc(products.createdAt))
      .limit(12),
    db
      .select()
      .from(products)
      .where(inArray(products.category, [...STOREFRONT_CATALOG_SLUGS]))
      .orderBy(desc(products.createdAt)),
  ]);

  const catalogByCategory = STOREFRONT_CATALOG_SLUGS.map((slug) => ({
    slug,
    label: collectionLabel(slug, settings),
    href: `/collections/${slug}`,
    products: catalogProducts.filter((p) => p.category === slug).slice(0, 2),
  })).filter((group) => group.products.length > 0);

  const categories = categoriesFromSettings(settings);
  const features = trustFeatures(settings);

  return (
    <>
      {/* 1. Hero — מבטל את ה-padding של ה-layout ויושב מאחורי ה-header */}
      <section className={`relative ${SITE_HEADER_NEGATIVE_OFFSET_CLASS} flex min-h-[100dvh] flex-col items-center justify-center bg-charcoal px-4 py-28 text-center sm:px-8`}>
        {/* overflow-hidden רק על הרקע — לא על כל הסקציה, כדי לא לחסום גלילה במובייל */}
        <div aria-hidden className="absolute inset-0 overflow-hidden">
          {settings.heroImage ? (
            <Image
              src={settings.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,154,94,0.18),transparent_55%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/45" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.12)_100%)]" />
        </div>

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center justify-center px-2 pt-32 sm:px-6 sm:pt-40">
          <p className="text-[11px] font-light tracking-[0.4em] text-gold-light sm:text-xs md:text-sm">
            {settings.heroBadge}
          </p>

          <h1 className="mt-6 max-w-5xl font-sans font-light leading-[1.1] text-ivory sm:mt-8">
            {settings.heroTitle.split("\n").map((line, index) => (
              <span
                key={index}
                className={
                  index === 0
                    ? "block text-[clamp(2.75rem,7.5vw,6.25rem)] font-normal tracking-[0.12em] drop-shadow-[0_2px_32px_rgba(0,0,0,0.65)]"
                    : "mt-3 block text-[clamp(1.35rem,3.8vw,2.85rem)] font-light tracking-[0.18em] text-gold-light drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)] sm:mt-4"
                }
              >
                {line}
              </span>
            ))}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-[clamp(0.95rem,2.2vw,1.35rem)] font-light leading-relaxed text-ivory drop-shadow-[0_1px_16px_rgba(0,0,0,0.55)] sm:mt-8">
            {settings.heroSubtitle}
          </p>

          <Button
            asChild
            className="group mt-10 rounded-none border border-gold bg-transparent px-14 py-7 text-xs font-normal tracking-[0.28em] text-gold-light shadow-none transition-all duration-300 hover:bg-gold hover:text-charcoal sm:mt-12 sm:px-16 sm:text-sm"
          >
            <Link href="/collections/engagement-rings">
              גלו את הקולקציות
              <ArrowLeft
                className="mr-3 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1"
                strokeWidth={1.5}
              />
            </Link>
          </Button>
        </div>

        {/* אינדיקטור גלילה */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce">
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
              אין כרגע מבצעים פעילים — נשמח לייעץ לכם בטלפון
            </p>
          </div>
        ) : (
          <ProductCarousel>
            {featuredProducts.map((product) => (
              <ProductCarouselItem key={product.id}>
                <ProductCard product={product} />
              </ProductCarouselItem>
            ))}
          </ProductCarousel>
        )}
      </section>

      {/* 2b. קטalog לפי קטegoria */}
      {catalogByCategory.length > 0 ? (
        <section className="border-t border-border/40 bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
            <SectionHeading
              eyebrow="בחירה לפי סגנון"
              title="גלו את התכשיטים"
            />

            <div className="fade-up mt-14 space-y-16">
              {catalogByCategory.map((group) => (
                <div key={group.slug}>
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <h3 className="font-serif text-2xl font-medium tracking-wide text-foreground">
                      {group.label}
                    </h3>
                    <Link
                      href={group.href}
                      className="text-xs font-light tracking-[0.2em] text-gold-dark transition-colors hover:text-gold"
                    >
                      לכל הקולקציה
                      <ArrowLeft
                        className="mr-2 inline h-3.5 w-3.5"
                        strokeWidth={1.5}
                      />
                    </Link>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
                    {group.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
            {features.map((feature) => (
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
      <section id="about" className="mx-auto max-w-7xl px-4 py-24 sm:px-8 scroll-mt-28">
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
