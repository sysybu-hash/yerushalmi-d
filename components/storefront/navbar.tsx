"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "דף הבית", href: "/" },
  { label: "טבעות אירוסין", href: "/collections/engagement-rings" },
  { label: "יהלומים", href: "/collections/diamonds" },
  { label: "שרשראות", href: "/collections/necklaces" },
  { label: "עגילים", href: "/collections/earrings" },
  { label: "צמידים", href: "/collections/bracelets" },
  { label: "אודות הבית", href: "/about" },
  { label: "צור קשר", href: "/contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // סגירה אוטומטית של המגירה בעת מעבר עמוד.
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-8">
        {/* ימין — כפתור תפריט */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="פתיחת תפריט"
              className="hover:bg-transparent"
            >
              <Menu className="h-5 w-5" strokeWidth={1.25} />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="flex w-[320px] flex-col border-l border-border/60 bg-background p-0 sm:w-[380px]"
          >
            <SheetHeader className="px-8 pb-4 pt-10 text-right">
              <SheetTitle className="font-serif text-xl font-light tracking-[0.1em]">
                ירושלמי
              </SheetTitle>
              <p className="text-[10px] tracking-luxury text-muted-foreground">
                יהלומים
              </p>
            </SheetHeader>

            <Separator className="bg-border/60" />

            {/* ניווט */}
            <nav className="flex-1 overflow-y-auto px-8 py-8">
              <ul className="space-y-6">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-light tracking-[0.08em] text-foreground/80 transition-colors duration-300 hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <Separator className="bg-border/60" />

            {/* אזור אישי — כניסה מאובטחת ודיסקרטית */}
            <div className="px-8 py-8">
              <Button
                asChild
                variant="outline"
                className="w-full rounded-none border-foreground/30 text-xs font-light tracking-[0.15em] hover:bg-foreground hover:text-background"
              >
                <Link href="/login">
                  <UserRound className="ml-2 h-3.5 w-3.5" strokeWidth={1.25} />
                  אזור אישי
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* מרכז — לוגו */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-center"
        >
          <span className="block font-serif text-xl font-light tracking-[0.15em] sm:text-2xl">
            ירושלמי
          </span>
          <span className="block text-[9px] uppercase tracking-[0.5em] text-muted-foreground">
            DIAMONDS
          </span>
        </Link>

        {/* שמאל — סל קניות */}
        <Button
          variant="ghost"
          size="icon"
          aria-label="סל קניות"
          className="hover:bg-transparent"
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
        </Button>
      </div>
    </header>
  );
}
