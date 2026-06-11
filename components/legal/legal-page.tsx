import * as React from "react";

/** מעטפת אחידה לעמודי תוכן משפטי — כותרת, תאריך עדכון וגוף טקסט */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-8 sm:py-20">
      <header className="text-center">
        <h1 className="font-serif text-3xl font-medium tracking-wide sm:text-4xl">
          {title}
        </h1>
        <span className="mx-auto mt-5 block h-px w-16 bg-gold" />
        <p className="mt-4 text-xs font-light text-muted-foreground">
          עדכון אחרון: {updatedAt}
        </p>
      </header>

      <div className="legal-body mt-12 space-y-8 text-right text-[15px] font-light leading-relaxed text-foreground/90">
        {children}
      </div>
    </article>
  );
}

/** סעיף עם כותרת משנה */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-medium tracking-wide text-foreground">
        {heading}
      </h2>
      {children}
    </section>
  );
}
