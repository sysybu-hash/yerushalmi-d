import { FlaskConical } from "lucide-react";
import { AiCrossNav } from "@/components/workspace/ai-cross-nav";

export const metadata = { title: "סטודיו בטא" };

export const dynamic = "force-dynamic";

/** יצירת תמונה/וידאו יכולה לקחת יותר מ-10 שניות ב-Vercel */
export const maxDuration = 120;

export default function StudioBetaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2">
            <FlaskConical
              aria-hidden
              className="h-5 w-5 text-gold-dark"
              strokeWidth={1}
            />
            <span className="font-serif text-lg font-light tracking-wide">
              סטודיו בטא
            </span>
          </div>
          <AiCrossNav current="studio-beta" />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6">
        {children}
      </main>
    </div>
  );
}
