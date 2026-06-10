import { db } from "@/db";
import { siteSettings } from "@/db/schema";

/**
 * ברירות המחדל של תוכן האתר — בעברית.
 * כל ערך כאן ניתן לדריסה ממסך "הגדרות האתר" באזור הניהול;
 * אם הטבלה ריקה, האתר מציג בדיוק את הערכים האלה (אין רגרסיה).
 */
export const SETTING_DEFAULTS = {
  /* פס הכרזה */
  announcementText: "משלוח עד הבית · אחריות מלאה ותעודה גימולוגית",

  /* Hero */
  heroBadge: "למעלה מ־35 שנה של מצוינות",
  heroTitle: "תכשיט יהלום — יצירה של רגע מרגש",
  heroSubtitle:
    "זיכרון נצחי וסיפור שיישאר בלב לתמיד. למעלה מ־35 שנה בהתמחות ביהלומים.",
  heroImage: "",

  /* מבצעים */
  featuredTitle: "מבצעים נבחרים",
  featuredSubtitle: "הזדמנויות מיוחדות",

  /* קטגוריות (שם + תמונה) */
  categoryRingsTitle: "טבעות",
  categoryRingsImage: "",
  categoryBraceletsTitle: "צמידים",
  categoryBraceletsImage: "",
  categoryNecklacesTitle: "תליונים",
  categoryNecklacesImage: "",
  categoryCustomTitle: "עיצוב אישי",
  categoryCustomImage: "",

  /* הסיפור / אודות */
  aboutTitle: "משפחת ירושלמי — דור שלישי ליהלומנים",
  aboutQuote: "כשבוחרים תכשיט יהלום — זו יצירה של רגע מרגש",
  aboutParagraph1:
    "למעלה מ־35 שנה בהתמחות ביהלומים, ליטוש, עיצוב, וייצור תכשיטים מהגלם ועד היצירה המוגמרת.",
  aboutParagraph2:
    "אנו עושים הכל: טבעות אירוסין, צמידי טניס, תליוני יהלום, תכשיטי אבני חן, עיצוב אישי ועוד...",
  aboutParagraph3:
    "כחברי בורסת היהלומים, אנו מתחייבים למקצועיות, שירות אישי, ויחס חם ומשפחתי.",
  aboutImage: "",

  /* יצירת קשר */
  contactPhone: "055-973-5000",
  contactWhatsapp: "972559735000",
  contactLocation1: 'בורסת היהלומים ר"ג: בניין מכבי',
  contactLocation2: "גבעת זאב: רח' שבט בנימין",
  contactNote: "שירות עד בית הלקוח · קונים זהב · כולל אחריות מלאה ותעודה גימולוגית",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SiteSettings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

/**
 * שליפת הגדרות האתר: שאילתה אחת, מיזוג מעל ברירות המחדל.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await db.select().from(siteSettings);

  const settings: SiteSettings = { ...SETTING_DEFAULTS };
  for (const row of rows) {
    if (row.key in settings && row.value) {
      settings[row.key as SettingKey] = row.value;
    }
  }
  return settings;
}
