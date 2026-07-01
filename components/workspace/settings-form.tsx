"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Save } from "lucide-react";

import { saveSiteSettings } from "@/app/(workspace)/workspace/settings/actions";
import type { SiteSettings } from "@/lib/site-settings";
import { COLLECTION_SETTING_KEYS } from "@/lib/site-settings";
import {
  AI_CAPABILITY_LABELS,
  AI_ENGINE_OPTIONS,
} from "@/lib/ai-engines";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SettingsImageField } from "@/components/workspace/settings-image-field";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="rounded-none px-10 text-xs font-light tracking-[0.15em]"
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        <>
          <Save className="ml-2 h-4 w-4" strokeWidth={1.5} />
          שמירת כל ההגדרות
        </>
      )}
    </Button>
  );
}

function EngineSelectField({
  name,
  capability,
  defaultValue,
}: {
  name: keyof SiteSettings;
  capability: keyof typeof AI_CAPABILITY_LABELS;
  defaultValue: string;
}) {
  const meta = AI_CAPABILITY_LABELS[capability];

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-light">
        {meta.label}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="flex h-10 w-full rounded-none border border-input bg-background px-3 py-2 text-sm font-light ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {AI_ENGINE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs font-light text-muted-foreground">{meta.hint}</p>
    </div>
  );
}

function TextField({
  name,
  label,
  defaultValue,
  textarea,
}: {
  name: string;
  label: string;
  defaultValue: string;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="font-light">
        {label}
      </Label>
      {textarea ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={3}
          className="rounded-none resize-none"
        />
      ) : (
        <Input
          id={name}
          name={name}
          defaultValue={defaultValue}
          className="rounded-none"
        />
      )}
    </div>
  );
}

function SectionCard({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      id={id}
      className="scroll-mt-28 rounded-none border-border/60 shadow-none"
    >
      <CardHeader>
        <CardTitle className="font-serif text-xl font-medium tracking-wide">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="font-light">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-5">{children}</CardContent>
    </Card>
  );
}

const SECTION_NAV = [
  { id: "meta", label: "מטא-דאטה" },
  { id: "logo", label: "לוגו" },
  { id: "announcement", label: "הכרזה" },
  { id: "hero", label: "Hero" },
  { id: "featured", label: "מבצעים" },
  { id: "collections", label: "קולקציות" },
  { id: "trust", label: "אמון" },
  { id: "about", label: "אודות" },
  { id: "contact", label: "יצירת קשר" },
  { id: "business", label: "עסק/חשבוניות" },
  { id: "ai-engines", label: "מנועי AI" },
  { id: "footer", label: "פוטר" },
] as const;

const COLLECTION_LABELS_HE: Record<string, string> = {
  rings: "טבעות",
  "engagement-rings": "טבעות אירוסין",
  bracelets: "צמידים",
  necklaces: "תליונים",
  earrings: "עגילים",
  diamonds: "יהלומים",
  custom: "עיצוב אישי",
};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [saved, setSaved] = React.useState(false);

  async function handleSubmit(formData: FormData) {
    setSaved(false);
    await saveSiteSettings(formData);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 4000);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <nav className="sticky top-20 z-10 flex flex-wrap gap-2 border border-border/60 bg-background/95 p-3 backdrop-blur-sm">
        {SECTION_NAV.map((s) => (
          <a
            key={s.id}
            href={`#settings-${s.id}`}
            className="rounded-none border border-border/40 px-3 py-1.5 text-[11px] font-light tracking-wide transition-colors hover:border-gold/50 hover:text-gold-dark"
          >
            {s.label}
          </a>
        ))}
      </nav>

      <SectionCard
        id="settings-meta"
        title="מטא-דאטה (SEO)"
        description="כותרת ותיאור האתר במנועי חיפוש"
      >
        <TextField
          name="siteTitle"
          label="כותרת האתר"
          defaultValue={settings.siteTitle}
        />
        <TextField
          name="siteDescription"
          label="תיאור האתר"
          defaultValue={settings.siteDescription}
          textarea
        />
      </SectionCard>

      <SectionCard
        id="settings-logo"
        title="לוגו"
        description="סמל היהלום שמופיע בתפריט העליון ובפוטר (מומלץ רקע שקוף, PNG/SVG)"
      >
        <SettingsImageField
          name="logoImage"
          label="קובץ הלוגו"
          defaultValue={settings.logoImage}
        />
      </SectionCard>

      <SectionCard
        id="settings-announcement"
        title="פס הכרזה"
        description="הפס הדק בראש האתר — מעל התפריט"
      >
        <TextField
          name="announcementText"
          label="טקסט ההכרזה"
          defaultValue={settings.announcementText}
        />
      </SectionCard>

      <SectionCard
        id="settings-hero"
        title="אזור פתיחה (Hero)"
        description="המסך הראשון שהלקוח רואה"
      >
        <TextField
          name="heroBadge"
          label="שורת פתיח קטנה (מעל הכותרת)"
          defaultValue={settings.heroBadge}
        />
        <TextField
          name="heroTitle"
          label="כותרת ראשית (שורה לכל שורת טקסט)"
          defaultValue={settings.heroTitle}
          textarea
        />
        <TextField
          name="heroSubtitle"
          label="תת-כותרת"
          defaultValue={settings.heroSubtitle}
          textarea
        />
        <SettingsImageField
          name="heroImage"
          label="תמונת רקע"
          defaultValue={settings.heroImage}
        />
      </SectionCard>

      <SectionCard id="settings-featured" title="מבצעים נבחרים">
        <TextField
          name="featuredSubtitle"
          label="שורת פתיח קטנה"
          defaultValue={settings.featuredSubtitle}
        />
        <TextField
          name="featuredTitle"
          label="כותרת הסקציה"
          defaultValue={settings.featuredTitle}
        />
      </SectionCard>

      <SectionCard
        id="settings-collections"
        title="קולקציות"
        description="שם ותמונת באנר לכל 7 הקולקציות + כרטיסי דף הבית (4 הראשונות)"
      >
        <div className="grid gap-8 sm:grid-cols-2">
          {COLLECTION_SETTING_KEYS.map((c) => (
            <div key={c.slug} className="space-y-4 rounded-none border border-border/40 p-4">
              <p className="text-xs font-light tracking-wide text-muted-foreground">
                {COLLECTION_LABELS_HE[c.slug] ?? c.slug}
              </p>
              <TextField
                name={c.titleKey}
                label="שם"
                defaultValue={settings[c.titleKey]}
              />
              <SettingsImageField
                name={c.imageKey}
                label="תמונת באנר"
                defaultValue={settings[c.imageKey]}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        id="settings-trust"
        title="אמון ושירות"
        description="4 פריטים בסקציה הכהה בדף הבית"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="space-y-3 border border-border/40 p-4">
              <p className="text-xs text-muted-foreground">פריט {n}</p>
              <TextField
                name={`trust${n}Title` as keyof SiteSettings}
                label="כותרת"
                defaultValue={
                  settings[`trust${n}Title` as keyof SiteSettings]
                }
              />
              <TextField
                name={`trust${n}Text` as keyof SiteSettings}
                label="תיאור"
                defaultValue={
                  settings[`trust${n}Text` as keyof SiteSettings]
                }
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard id="settings-about" title="הסיפור שלנו (אודות)">
        <TextField
          name="aboutQuote"
          label="ציטוט פתיחה"
          defaultValue={settings.aboutQuote}
        />
        <TextField
          name="aboutTitle"
          label="כותרת"
          defaultValue={settings.aboutTitle}
        />
        <TextField
          name="aboutParagraph1"
          label="פסקה 1"
          defaultValue={settings.aboutParagraph1}
          textarea
        />
        <TextField
          name="aboutParagraph2"
          label="פסקה 2"
          defaultValue={settings.aboutParagraph2}
          textarea
        />
        <TextField
          name="aboutParagraph3"
          label="פסקה 3"
          defaultValue={settings.aboutParagraph3}
          textarea
        />
        <SettingsImageField
          name="aboutImage"
          label="תמונת הסקציה"
          defaultValue={settings.aboutImage}
        />
      </SectionCard>

      <SectionCard id="settings-contact" title="יצירת קשר">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="contactPhone"
            label="טלפון"
            defaultValue={settings.contactPhone}
          />
          <TextField
            name="contactWhatsapp"
            label="WhatsApp (פורמט בינלאומי, למשל 972559735000)"
            defaultValue={settings.contactWhatsapp}
          />
        </div>
        <TextField
          name="contactLocation1"
          label="סניף 1"
          defaultValue={settings.contactLocation1}
        />
        <TextField
          name="contactLocation2"
          label="סניף 2"
          defaultValue={settings.contactLocation2}
        />
        <TextField
          name="contactNote"
          label="שורת שירות (מופיעה בתחתית ובפוטר)"
          defaultValue={settings.contactNote}
        />
      </SectionCard>

      <SectionCard
        id="settings-business"
        title="פרטי עסק וחשבוניות"
        description="מופיעים בכותרת החשבוניות שמופקות באזור הניהול"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="businessName"
            label="שם העסק"
            defaultValue={settings.businessName}
          />
          <TextField
            name="businessId"
            label="ח.פ / עוסק מורשה"
            defaultValue={settings.businessId}
          />
        </div>
        <TextField
          name="businessAddress"
          label="כתובת העסק"
          defaultValue={settings.businessAddress}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="invoiceVatRate"
            label="שיעור מע״מ (%)"
            defaultValue={settings.invoiceVatRate}
          />
        </div>
        <TextField
          name="invoiceFooterNote"
          label="הערת תחתית בחשבונית"
          defaultValue={settings.invoiceFooterNote}
          textarea
        />
      </SectionCard>

      <SectionCard
        id="settings-ai-engines"
        title="מנועי AI"
        description="ברירת מחדל לכל האתר — סטודיו, מילוי אוטומטי במוצרים וספריית תוכן. ניתן לדרוס לכל פרויקט בסטודיו."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <EngineSelectField
            name="aiEngineVision"
            capability="vision"
            defaultValue={settings.aiEngineVision}
          />
          <EngineSelectField
            name="aiEngineText"
            capability="text"
            defaultValue={settings.aiEngineText}
          />
          <EngineSelectField
            name="aiEngineCutout"
            capability="cutout"
            defaultValue={settings.aiEngineCutout}
          />
          <EngineSelectField
            name="aiEngineVideo"
            capability="video"
            defaultValue={settings.aiEngineVideo}
          />
        </div>
        <p className="text-xs font-light text-muted-foreground">
          מצב אוטומטי בוחר Gemini לזיהוי תמונה וטקסט כש־GEMINI_API_KEY מוגדר;
          אחרת Replicate. הסרת רקע ווידאו תמיד דרך Replicate.
        </p>
      </SectionCard>

      <SectionCard id="settings-footer" title="פוטר">
        <TextField
          name="footerCopyright"
          label="שורת זכויות יוצרים"
          defaultValue={settings.footerCopyright}
        />
      </SectionCard>

      <div className="flex items-center gap-4">
        <SubmitButton />
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-light text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            ההגדרות נשמרו — האתר עודכן
          </span>
        )}
      </div>
    </form>
  );
}
