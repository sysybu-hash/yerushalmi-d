import Link from "next/link";

import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-8">
        <p className="font-serif text-lg font-light tracking-[0.15em]">
          ירושלמי
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.5em] text-muted-foreground">
          DIAMONDS
        </p>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {[
            { label: "קולקציות", href: "/collections/diamonds" },
            { label: "אודות", href: "/about" },
            { label: "צור קשר", href: "/contact" },
            { label: "פרטיות", href: "/privacy" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[11px] font-light tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Separator className="mx-auto mt-10 max-w-xs bg-border/60" />

        <p className="mt-8 text-[10px] font-light tracking-widest text-muted-foreground">
          © {new Date().getFullYear()} ירושלמי יהלומים. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
