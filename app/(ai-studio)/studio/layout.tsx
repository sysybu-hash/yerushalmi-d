import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { AiCrossNav } from "@/components/workspace/ai-cross-nav";

export const metadata = { title: "סטודיו תוכן AI" };

export const dynamic = "force-dynamic";

/** rembg + composite + העלאה ל-Cloudinary — דורש יותר מ-10 שניות ב-Vercel */
export const maxDuration = 60;

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-2">
            <Sparkles
              aria-hidden
              className="h-5 w-5 text-gold-dark"
              strokeWidth={1}
            />
            <span className="font-serif text-lg font-light tracking-wide">
              סטודיו AI
            </span>
          </div>
          <AiCrossNav current="studio" />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>

      <footer className="shrink-0 border-t border-border/40 py-3 text-center">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-light tracking-[0.1em] text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          צפייה בחנות
        </Link>
      </footer>
    </div>
  );
}
