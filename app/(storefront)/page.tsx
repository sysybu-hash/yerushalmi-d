import Link from "next/link";
import { desc } from "drizzle-orm";
import {
  BadgePercent,
  Gem,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/storefront/product-card";

// הדף מציג מלאי חי מהדאטהבייס — מתרענן עד פעם בדקה
export const revalidate = 60;

/* ------------------------------------------------------------------ */
/* נתוני תוכן קבועים                                                   */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { name: "טבעות", href: "/collections/rings" },
  { name: "צמידים", href: "/collections/bracelets" },
  { name: "תליונים", href: "/collections/necklaces" },
  { name: "עיצוב אישי", href: "/collections/custom" },
];

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

/* ------------------------------------------------------------------ */
/* העמוד                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  // 12 המוצרים האחרונים מהמלאי, מהחדש לישן
  const featuredProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(12);

  return (
    <>
      {/* 1. Hero — אזור פתיחה */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-800 px-4 text-center text-stone-50">
        {/* נצנוץ עדין ברקע */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]"
        />

        <Gem
          aria-hidden
          className="relative h-10 w-10 text-stone-300"
          strokeWidth={0.75}
        />

        <h1 className="relative mt-8 max-w-4xl font-serif text-4xl font-light leading-tight tracking-wide sm:text-6xl">
          תכשיט יהלום — יצירה של רגע מרגש
        </h1>

        <p className="relative mt-6 max-w-2xl text-sm font-light leading-relaxed text-stone-300 sm:text-base">
          זיכרון נצחי וסיפור שיישאר בלב לתמיד. למעלה מ־35 שנה בהתמחות
          ביהלומים.
        </p>

        <Button
          asChild
          variant="outline"
          className="relative mt-10 rounded-none border-stone-300/60 bg-transparent px-10 text-xs font-light tracking-[0.2em] text-stone-100 hover:bg-stone-100 hover:text-stone-900"
        >
          <Link href="/collections/rings">לכל הקולקציות</Link>
        </Button>
      </section>

      {/* 2. מבצעים נבחרים — מוצרים אמיתיים מהמלאי */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="text-center">
          <p className="text-[11px] tracking-[0.25em] text-muted-foreground">
            הזדמנויות מיוחדות
          </p>
          <h2 className="mt-3 font-serif text-3xl font-light tracking-wide sm:text-4xl">
            מבצעים נבחרים
          </h2>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-4 py-12 text-center">
            <Gem
              aria-hidden
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <p className="text-sm font-light text-muted-foreground">
              הקולקציה מתעדכנת בימים אלה — נשמח לראותכם בקרוב
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. הקולקציות שלנו */}
      <section className="bg-stone-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
          <div className="text-center">
            <p className="text-[11px] tracking-[0.25em] text-muted-foreground">
              עולם של יופי
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light tracking-wide sm:text-4xl">
              הקולקציות שלנו
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group relative block aspect-[4/5] overflow-hidden border border-border/60"
              >
                {/* רקע הקטגוריה — placeholder עם זום עדין בריחוף */}
                <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-700 to-stone-500 transition-transform duration-700 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/10" />

                <div className="relative flex h-full flex-col items-center justify-end pb-10 text-stone-50">
                  <Gem
                    aria-hidden
                    className="mb-4 h-6 w-6 text-stone-200"
                    strokeWidth={0.75}
                  />
                  <h3 className="font-serif text-2xl font-light tracking-[0.1em]">
                    {category.name}
                  </h3>
                  <span className="mt-3 border-b border-stone-200/0 pb-0.5 text-[11px] font-light tracking-[0.2em] text-stone-200 transition-colors duration-300 group-hover:border-stone-200">
                    לצפייה בקולקציה
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. אמון ושירות */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_FEATURES.map((feature) => (
            <div key={feature.title} className="text-center">
              <feature.icon
                aria-hidden
                className="mx-auto h-8 w-8 text-foreground/70"
                strokeWidth={0.75}
              />
              <h3 className="mt-5 text-sm font-medium tracking-[0.1em]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. הסיפור שלנו */}
      <section className="bg-stone-950 text-stone-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-8 lg:grid-cols-2">
          {/* טקסט */}
          <div>
            <p className="text-[11px] tracking-[0.25em] text-stone-400">
              הסיפור שלנו
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light leading-snug tracking-wide sm:text-4xl">
              משפחת ירושלמי — דור שלישי ליהלומנים
            </h2>

            <div className="mt-8 space-y-5 text-sm font-light leading-relaxed text-stone-300 sm:text-base">
              <p>
                למעלה מ־35 שנה בהתמחות ביהלומים, ליטוש, עיצוב, וייצור תכשיטים
                מהגלם ועד היצירה המוגמרת.
              </p>
              <p>
                אנו עושים הכל: טבעות אירוסין, צמידי טניס, תליוני יהלום, תכשיטי
                אבני חן, עיצוב אישי ועוד...
              </p>
              <p>
                כחברי בורסת היהלומים, אנו מתחייבים למקצועיות, שירות אישי, ויחס
                חם ומשפחתי.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="mt-10 rounded-none border-stone-400/60 bg-transparent px-10 text-xs font-light tracking-[0.2em] text-stone-100 hover:bg-stone-100 hover:text-stone-900"
            >
              <Link href="/about">לסיפור המלא</Link>
            </Button>
          </div>

          {/* תמונה — placeholder עד צילומי הסדנה */}
          <div className="relative aspect-[4/5] overflow-hidden border border-stone-700/60 bg-gradient-to-br from-stone-800 to-stone-600">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-stone-400">
              <Gem aria-hidden className="h-12 w-12" strokeWidth={0.5} />
              <p className="text-[11px] font-light tracking-[0.3em]">
                מהגלם ועד היצירה
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. יצירת קשר וסניפים */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-8">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground">
          נשמח לארח אתכם
        </p>
        <h2 className="mt-3 font-serif text-3xl font-light tracking-wide sm:text-4xl">
          יצירת קשר
        </h2>

        {/* טלפון — בולט במיוחד */}
        <a
          href="tel:055-973-5000"
          className="mt-10 inline-flex items-center gap-3 font-serif text-4xl font-light tracking-wider transition-colors hover:text-stone-600 sm:text-5xl"
          dir="ltr"
        >
          <Phone aria-hidden className="h-7 w-7" strokeWidth={1} />
          055-973-5000
        </a>

        {/* סניפים */}
        <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          <div className="flex items-center gap-2 text-sm font-light">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.25}
            />
            <span>בורסת היהלומים ר&quot;ג: בניין מכבי</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-light">
            <MapPin
              aria-hidden
              className="h-4 w-4 shrink-0 text-muted-foreground"
              strokeWidth={1.25}
            />
            <span>גבעת זאב: רח&apos; שבט בנימין</span>
          </div>
        </div>

        <Separator className="mx-auto mt-12 max-w-xs bg-border/60" />

        <p className="mt-10 text-sm font-light leading-relaxed text-muted-foreground">
          שירות עד בית הלקוח · קונים זהב · כולל אחריות מלאה ותעודה גימולוגית
        </p>
      </section>
    </>
  );
}
