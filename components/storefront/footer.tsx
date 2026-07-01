import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";

import { BrandLogo } from "@/components/storefront/brand-logo";
import type { StoreNavLink } from "@/components/storefront/navbar";
import type { SiteSettings } from "@/lib/site-settings";

export function Footer({
  settings,
  navLinks,
}: {
  settings: SiteSettings;
  navLinks: readonly StoreNavLink[];
}) {
  const collectionLinks = navLinks.filter((link) =>
    link.href.startsWith("/collections/")
  );

  return (
    <footer className="border-t border-gold/30 bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="grid gap-12 text-center sm:grid-cols-3 sm:text-right">
          <div>
            <BrandLogo
              logoSrc={settings.logoImage}
              href="/"
              size="lg"
              tone="light"
              className="mx-auto sm:mx-0 sm:items-start sm:text-right"
            />
            <p className="mt-4 text-xs font-light leading-relaxed text-ivory/60">
              {settings.contactNote}
            </p>
          </div>

          <nav>
            <h3 className="text-xs font-normal uppercase tracking-[0.25em] text-gold">
              קולקציות
            </h3>
            <ul className="mt-5 space-y-3">
              {collectionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-light text-ivory/75 transition-colors hover:text-gold-light"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="text-sm font-light text-ivory/75 transition-colors hover:text-gold-light"
                >
                  צור קשר
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-normal uppercase tracking-[0.25em] text-gold">
              יצירת קשר
            </h3>
            <ul className="mt-5 space-y-3 text-sm font-light text-ivory/75">
              <li>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold-light"
                >
                  <Phone className="h-3.5 w-3.5 text-gold" strokeWidth={1.25} />
                  <span dir="ltr">{settings.contactPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${settings.contactWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-gold-light"
                >
                  <MessageCircle
                    className="h-3.5 w-3.5 text-gold"
                    strokeWidth={1.25}
                  />
                  וואטסאפ
                </a>
              </li>
              <li className="flex items-center justify-center gap-2 sm:justify-start">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-gold"
                  strokeWidth={1.25}
                />
                {settings.contactLocation1}
              </li>
              <li className="flex items-center justify-center gap-2 sm:justify-start">
                <MapPin
                  className="h-3.5 w-3.5 shrink-0 text-gold"
                  strokeWidth={1.25}
                />
                {settings.contactLocation2}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-ivory/10 pt-8 text-center">
          <nav aria-label="קישורים משפטיים">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-light tracking-[0.08em] text-ivory/60">
              <li>
                <Link href="/accessibility" className="transition-colors hover:text-gold-light">
                  הצהרת נגישות
                </Link>
              </li>
              <li aria-hidden className="text-ivory/25">·</li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-gold-light">
                  מדיניות פרטיות
                </Link>
              </li>
              <li aria-hidden className="text-ivory/25">·</li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-gold-light">
                  תקנון ותנאי שימוש
                </Link>
              </li>
            </ul>
          </nav>
          <p className="mt-5 text-[11px] font-light tracking-[0.15em] text-ivory/50">
            {settings.footerCopyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
