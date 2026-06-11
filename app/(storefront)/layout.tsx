import type { Metadata } from "next";
import { Footer } from "@/components/storefront/footer";
import { Navbar } from "@/components/storefront/navbar";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { storeNavLinks } from "@/lib/categories";
import { getSiteSettings } from "@/lib/site-settings";

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        announcementText={settings.announcementText}
        contactPhone={settings.contactPhone}
        navLinks={navLinks}
      />
      {/* פיצוי על ה-header הקבוע; דף הבית מבטל אותו עם margin שלילי ל-Hero */}
      <main className="pt-[104px]">{children}</main>
      <Footer settings={settings} navLinks={navLinks} />
      <WhatsAppButton phone={settings.contactWhatsapp} />
    </div>
  );
}
