"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, UserRound } from "lucide-react";

import { BrandLogo } from "@/components/storefront/brand-logo";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type StoreNavLink = {
  label: string;
  href: string;
};

type NavbarProps = {
  announcementText: string;
  contactPhone: string;
  logoSrc: string;
  navLinks: readonly StoreNavLink[];
};

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({
  announcementText,
  contactPhone,
  logoSrc,
  navLinks,
}: NavbarProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const isHome = pathname === "/";
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const transparent = isHome && !scrolled;

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="bg-charcoal px-4 py-1.5 text-center">
        <p className="text-[11px] font-light tracking-[0.15em] text-ivory/90">
          {announcementText}
          <a
            href={`tel:${contactPhone}`}
            className="mr-2 text-gold-light transition-colors hover:text-gold"
            dir="ltr"
          >
            {contactPhone}
          </a>
        </p>
      </div>

      <div
        className={cn(
          "transition-all duration-500",
          transparent
            ? "bg-transparent"
            : "border-b border-border/60 bg-background/95 shadow-sm backdrop-blur-md"
        )}
      >
        <div className="mx-auto flex min-h-[100px] max-w-7xl items-center justify-between px-4 py-2 sm:min-h-[104px] sm:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="פתיחת תפריט"
                className={cn(
                  "h-11 w-11 border transition-colors",
                  transparent
                    ? "border-ivory/40 bg-charcoal/35 text-ivory backdrop-blur-sm hover:border-gold-light hover:bg-charcoal/55 hover:text-gold-light"
                    : "border-border/70 bg-background/60 text-foreground hover:border-gold-dark/60 hover:bg-secondary hover:text-gold-dark"
                )}
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="flex w-[340px] flex-col border-l-0 bg-charcoal p-0 text-ivory sm:w-[400px]"
            >
              <SheetHeader className="px-8 pb-5 pt-12 text-center">
                <BrandLogo logoSrc={logoSrc} size="md" tone="light" />
              </SheetHeader>

              <Separator className="bg-ivory/10" />

              <nav aria-label="ניווט ראשי" className="flex-1 overflow-y-auto px-8 py-8">
                <ul className="space-y-5">
                  {navLinks.map((link, index) => {
                    const active = isNavActive(pathname, link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="group flex items-baseline gap-4"
                        >
                          <span className="text-[11px] font-light tabular-nums text-gold/70">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span
                            className={cn(
                              "border-b pb-0.5 text-lg font-normal tracking-[0.04em] transition-all duration-300",
                              active
                                ? "border-gold text-gold-light"
                                : "border-transparent text-ivory group-hover:border-gold group-hover:text-gold-light"
                            )}
                          >
                            {link.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <Separator className="bg-ivory/10" />

              <div className="space-y-4 px-8 py-8">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-none border-gold/60 bg-transparent text-xs font-normal tracking-[0.2em] text-gold-light hover:bg-gold hover:text-charcoal"
                >
                  <Link href="/login">
                    <UserRound className="ml-2 h-4 w-4" strokeWidth={1.25} />
                    כניסת מנהל
                  </Link>
                </Button>
                <a
                  href={`tel:${contactPhone}`}
                  className="flex items-center justify-center gap-2 text-sm font-light text-ivory/70 transition-colors hover:text-gold-light"
                >
                  <Phone className="h-3.5 w-3.5" strokeWidth={1.25} />
                  <span dir="ltr">{contactPhone}</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <BrandLogo
              logoSrc={logoSrc}
              href="/"
              size="md"
              tone={transparent ? "light" : "dark"}
              priority
              className="transition-opacity duration-500 group-hover:opacity-90"
            />
          </div>

          <div className={cn(transparent ? "text-ivory" : "text-foreground")}>
            <CartSheet />
          </div>
        </div>
      </div>
    </header>
  );
}
