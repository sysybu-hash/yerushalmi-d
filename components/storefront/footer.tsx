import Link from "next/link";
import { Gem, MapPin, MessageCircle, Phone } from "lucide-react";

import { STORE_NAV_LINKS } from "@/lib/categories";
import type { SiteSettings } from "@/lib/site-settings";

export function Footer({ settings }: { settings: SiteSettings }) {
  const collectionLinks = STORE_NAV_LINKS.filter((link) =>
    link.href.startsWith("/collections/")
  );

  return (
    <footer className="border-t border-gold/30 bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <div className="grid gap-12 text-center sm:grid-cols-3 sm:text-right">
          <div>
            <Gem
              aria-hidden
              className="mx-auto h-6 w-6 text-gold sm:mx-0"
              strokeWidth={0.75}
            />
            <p className="mt-4 font-serif text-xl font-medium tracking-[0.14em]">
              ירושלמי
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.5em] text-gold">
              יהלומים
            </p>
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
          <p className="text-[11px] font-light tracking-[0.15em] text-ivory/50">
            © {new Date().getFullYear()} ירושלמי יהלומים · כל הזכויות שמורות
          </p>
        </div>
      </div>
    </footer>
  );
}
