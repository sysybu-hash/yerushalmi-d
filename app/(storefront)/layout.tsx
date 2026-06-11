import type { Metadata } from "next";
import { AccessibilityWidget } from "@/components/a11y/accessibility-widget";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { Footer } from "@/components/storefront/footer";
import { Navbar } from "@/components/storefront/navbar";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { storeNavLinks } from "@/lib/categories";
import { getSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";

// ה-layout קורא הגדרות מהדאטהבייס — נטען בזמן בקשה
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings.siteTitle,
      template: `%s | ${settings.siteTitle.split("|")[0]?.trim() ?? "ירושלמי יהלומים"}`,
    },
    description: settings.siteDescription,
  };
}

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const navLinks = storeNavLinks(settings);
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JewelryStore",
    name: "ירושלמי יהלומים",
    description: settings.siteDescription,
    url: siteUrl,
    telephone: settings.contactPhone,
    address: [settings.contactLocation1, settings.contactLocation2].filter(
      Boolean
    ),
    areaServed: "IL",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a href="#main-content" className="skip-link">
        דלג לתוכן המרכזי
      </a>
      <Navbar
        announcementText={settings.announcementText}
        contactPhone={settings.contactPhone}
        logoSrc={settings.logoImage}
        navLinks={navLinks}
      />
      {/* פיצוי על ה-header הקבוע; דף הבית מבטל אותו עם margin שלילי ל-Hero */}
      <main id="main-content" className="pt-[104px]">
        {children}
      </main>
      <Footer settings={settings} navLinks={navLinks} />
      <WhatsAppButton phone={settings.contactWhatsapp} />
      <AccessibilityWidget />
      <CookieConsent />
    </div>
  );
}
