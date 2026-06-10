import { Navbar } from "@/components/storefront/navbar";
import { Footer } from "@/components/storefront/footer";
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar
        announcementText={settings.announcementText}
        contactPhone={settings.contactPhone}
      />
      {/* פיצוי על ה-header הקבוע; דף הבית מבטל אותו עם margin שלילי ל-Hero */}
      <main className="flex-1 pt-[104px]">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
