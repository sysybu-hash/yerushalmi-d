import { db } from "@/db";
import { siteSettings } from "@/db/schema";

/**
 * ברירות המחדל של תוכן האתר — בעברית.
 * כל ערך כאן ניתן לדריסה ממסך "הגדרות האתר" באזור הניהול;
 * אם הטבלה ריקה, האתר מציג בדיוק את הערכים האלה (אין רגרסיה).
 */
export const SETTING_DEFAULTS = {
  /* מטא-דאטה */
  siteTitle: "ירושלמי יהלומים | YERUSHALMI DIAMONDS",
  siteDescription:
    "יהלומים נדירים ותכשיטי יוקרה בעבודת יד — אלגנטיות על-זמנית.",

  /* לוגו — סמל היהלום (רקע שקוף), ניתן להחלפה מההגדרות */
  logoImage: "/logo-mark.png",

  /* פס הכרזה */
  announcementText: "משלוח עד הבית · אחריות מלאה ותעודה גימולוגית",

  /* Hero */
  heroBadge: "למעלה מ־35 שנה של מצוינות",
  heroTitle: "ירושלמי\nכל מוצר - יצירה",
  heroSubtitle:
    "זיכרון נצחי וסיפור שיישאר בלב לתמיד. למעלה מ־35 שנה בהתמחות ביהלומים.",
  heroImage: "/images/hero-background.jpg",

  /* מבצעים */
  featuredTitle: "מבצעים נבחרים",
  featuredSubtitle: "הזדמנויות מיוחדות",

  /* קולקציות (שם + תמונה) — 7 slugs */
  categoryRingsTitle: "טבעות",
  categoryRingsImage: "",
  categoryEngagementRingsTitle: "טבעות אירוסין",
  categoryEngagementRingsImage: "",
  categoryBraceletsTitle: "צמידים",
  categoryBraceletsImage: "",
  categoryNecklacesTitle: "תליונים ושרשראות",
  categoryNecklacesImage: "",
  categoryEarringsTitle: "עגילים",
  categoryEarringsImage: "",
  categoryDiamondsTitle: "יהלומים",
  categoryDiamondsImage: "",
  categoryCustomTitle: "עיצוב אישי",
  categoryCustomImage: "",

  /* אמון ושירות (4 פריטים בדף הבית) */
  trust1Title: "ללא מתווכים",
  trust1Text: "ישירות מהיצרן לצרכן",
  trust2Title: "אמינות ושקיפות",
  trust2Text: "כולל אחריות מלאה ותעודה גימולוגית",
  trust3Title: "שירות VIP",
  trust3Text: "שירות אישי עד בית הלקוח",
  trust4Title: "מחירים ללא תחרות",
  trust4Text: "באיכות הגבוהה ביותר, כי אתם קונים מיד ראשונה",

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

  /* פוטר */
  footerCopyright: "© ירושלמי יהלומים. כל הזכויות שמורות.",

  /* פרטי עסק — לכותרת החשבוניות */
  businessName: "ירושלמי יהלומים",
  businessId: "",
  businessAddress: 'בורסת היהלומים, רמת גן',
  invoiceVatRate: "18",
  invoiceFooterNote: "תודה שבחרתם בירושלמי יהלומים — כולל אחריות מלאה ותעודה גימולוגית.",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type SiteSettings = Record<SettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

/** מפתחות תמונה לקולקציות — לשימוש בסטודיו ובהגדרות */
export const COLLECTION_SETTING_KEYS: {
  slug: string;
  titleKey: SettingKey;
  imageKey: SettingKey;
  href: string;
}[] = [
  {
    slug: "rings",
    titleKey: "categoryRingsTitle",
    imageKey: "categoryRingsImage",
    href: "/collections/rings",
  },
  {
    slug: "engagement-rings",
    titleKey: "categoryEngagementRingsTitle",
    imageKey: "categoryEngagementRingsImage",
    href: "/collections/engagement-rings",
  },
  {
    slug: "bracelets",
    titleKey: "categoryBraceletsTitle",
    imageKey: "categoryBraceletsImage",
    href: "/collections/bracelets",
  },
  {
    slug: "necklaces",
    titleKey: "categoryNecklacesTitle",
    imageKey: "categoryNecklacesImage",
    href: "/collections/necklaces",
  },
  {
    slug: "earrings",
    titleKey: "categoryEarringsTitle",
    imageKey: "categoryEarringsImage",
    href: "/collections/earrings",
  },
  {
    slug: "diamonds",
    titleKey: "categoryDiamondsTitle",
    imageKey: "categoryDiamondsImage",
    href: "/collections/diamonds",
  },
  {
    slug: "custom",
    titleKey: "categoryCustomTitle",
    imageKey: "categoryCustomImage",
    href: "/collections/custom",
  },
];

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
