type CategoryPageProps = {
  params: { category: string };
};

const CATEGORY_NAMES: Record<string, string> = {
  "engagement-rings": "טבעות אירוסין",
  diamonds: "יהלומים",
  necklaces: "שרשראות",
  earrings: "עגילים",
  bracelets: "צמידים",
};

function categoryName(slug: string) {
  return CATEGORY_NAMES[slug] ?? decodeURIComponent(slug);
}

export function generateMetadata({ params }: CategoryPageProps) {
  return { title: categoryName(params.category) };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-8">
      <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
        קולקציה
      </p>
      <h1 className="mt-4 font-serif text-4xl font-light tracking-wide">
        {categoryName(params.category)}
      </h1>
      <p className="mt-6 text-sm font-light text-muted-foreground">
        המוצרים בקולקציה זו יפורסמו דרך אזור הניהול (Workspace).
      </p>
    </section>
  );
}
