import { SettingsForm } from "@/components/workspace/settings-form";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata = { title: "הגדרות האתר" };

// העמוד קורא מהדאטהבייס — חייב להירנדר בכל בקשה
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-wide">
          הגדרות האתר
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          כל הטקסטים והתמונות של החנות — שינוי כאן מתעדכן באתר מיד
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
