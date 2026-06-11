import { Footer } from "@/components/storefront/footer";
import { Navbar } from "@/components/storefront/navbar";
import { WhatsAppButton } from "@/components/storefront/whatsapp-button";
import { getSiteSettings } from "@/lib/site-settings";

// ה-layout קורא הגדרות מהדאטהבייס — נטען בזמן בקשה
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        announcementText={settings.announcementText}
        contactPhone={settings.contactPhone}
      />
      {/* פיצוי על ה-header הקבוע; דף הבית מבטל אותו עם margin שלילי ל-Hero */}
      <main className="pt-[104px]">{children}</main>
      <Footer settings={settings} />
      <WhatsAppButton phone={settings.contactWhatsapp} />
    </div>
  );
}
