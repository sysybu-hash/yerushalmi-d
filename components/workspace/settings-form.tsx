"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Save } from "lucide-react";

import { saveSiteSettings } from "@/app/(workspace)/workspace/settings/actions";
import type { SiteSettings } from "@/lib/site-settings";
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
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-none border-border/60 shadow-none">
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
      <SectionCard
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
          label="כותרת ראשית"
          defaultValue={settings.heroTitle}
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

      <SectionCard title="מבצעים נבחרים">
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
        title="קולקציות"
        description="ארבעת כרטיסי הקטגוריות בדף הבית"
      >
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <TextField
              name="categoryRingsTitle"
              label="קטגוריה 1 — שם"
              defaultValue={settings.categoryRingsTitle}
            />
            <SettingsImageField
              name="categoryRingsImage"
              label="קטגוריה 1 — תמונה"
              defaultValue={settings.categoryRingsImage}
            />
          </div>
          <div className="space-y-4">
            <TextField
              name="categoryBraceletsTitle"
              label="קטגוריה 2 — שם"
              defaultValue={settings.categoryBraceletsTitle}
            />
            <SettingsImageField
              name="categoryBraceletsImage"
              label="קטגוריה 2 — תמונה"
              defaultValue={settings.categoryBraceletsImage}
            />
          </div>
          <div className="space-y-4">
            <TextField
              name="categoryNecklacesTitle"
              label="קטגוריה 3 — שם"
              defaultValue={settings.categoryNecklacesTitle}
            />
            <SettingsImageField
              name="categoryNecklacesImage"
              label="קטגוריה 3 — תמונה"
              defaultValue={settings.categoryNecklacesImage}
            />
          </div>
          <div className="space-y-4">
            <TextField
              name="categoryCustomTitle"
              label="קטגוריה 4 — שם"
              defaultValue={settings.categoryCustomTitle}
            />
            <SettingsImageField
              name="categoryCustomImage"
              label="קטגוריה 4 — תמונה"
              defaultValue={settings.categoryCustomImage}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="הסיפור שלנו (אודות)">
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

      <SectionCard title="יצירת קשר">
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
