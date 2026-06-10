import { desc, eq } from "drizzle-orm";
import { Gem } from "lucide-react";

import { db } from "@/db";
import { products } from "@/db/schema";
import { ProductCard } from "@/components/storefront/product-card";

// העמוד מציג מלאי חי מהדאטהבייס — נטען בזמן בקשה, לא בזמן בנייה
export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: { category: string };
};

const CATEGORY_NAMES: Record<string, string> = {
  rings: "טבעות",
  "engagement-rings": "טבעות אירוסין",
  bracelets: "צמידים",
  necklaces: "שרשראות / תליונים",
  earrings: "עגילים",
  diamonds: "יהלומים",
  custom: "עיצוב אישי",
};

function categoryName(slug: string) {
  return CATEGORY_NAMES[slug] ?? decodeURIComponent(slug);
}

export function generateMetadata({ params }: CategoryPageProps) {
  return { title: categoryName(params.category) };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryProducts = await db
    .select()
    .from(products)
    .where(eq(products.category, params.category))
    .orderBy(desc(products.createdAt));

  return (
    <>
      {/* Hero — באנר הקטגוריה */}
      <section className="relative flex min-h-[40vh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-800 px-4 text-center text-stone-50">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_55%)]"
        />

        <p className="relative text-[11px] tracking-[0.25em] text-stone-400">
          הקולקציות שלנו
        </p>
        <h1 className="relative mt-4 font-serif text-4xl font-light tracking-wide sm:text-5xl">
          {categoryName(params.category)}
        </h1>
      </section>

      {/* רשת המוצרים */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        {categoryProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <Gem
              aria-hidden
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={0.75}
            />
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              קולקציה זו מתעדכנת בימים אלה — נשמח לראותכם בקרוב
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm font-light text-muted-foreground">
              {categoryProducts.length} פריטים בקולקציה
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
