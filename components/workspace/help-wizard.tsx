"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Gem,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type HelpStep = {
  title: string;
  body: string;
  tip?: string;
};

type HelpTopic = {
  id: string;
  label: string;
  icon: LucideIcon;
  summary: string;
  link?: { href: string; label: string };
  steps: HelpStep[];
};

const TOPICS: HelpTopic[] = [
  {
    id: "dashboard",
    label: "לוח בקרה",
    icon: LayoutDashboard,
    summary: "מבט-על מהיר על מצב החנות — מכירות, לקוחות, מלאי והזמנות ממתינות.",
    link: { href: "/workspace", label: "פתיחת לוח הבקרה" },
    steps: [
      {
        title: "קריאת הנתונים",
        body: "בראש הלוח מוצגים ארבעה כרטיסי סיכום: סך מכירות, מספר לקוחות, פריטים במלאי והזמנות הממתינות לטיפול. כל כרטיס לחיץ ומוביל ישירות למסך הרלוונטי.",
      },
      {
        title: "מעקב אחר פעילות אחרונה",
        body: "מתחת לכרטיסים מופיעה רשימת הפעילות האחרונה — הזמנות חדשות, פניות ולקוחות שנוספו, עם חותמת זמן. כך תזהו במהירות מה דורש טיפול.",
        tip: "התחילו כל יום בלוח הבקרה כדי לראות מה השתנה מאז הכניסה הקודמת.",
      },
    ],
  },
  {
    id: "products",
    label: "ניהול מלאי",
    icon: Gem,
    summary: "הוספה, עריכה, שכפול ומחיקה של מוצרים, כולל שתי תמונות וקטגוריות.",
    link: { href: "/workspace/products", label: "פתיחת ניהול המלאי" },
    steps: [
      {
        title: "הוספת מוצר חדש",
        body: "לחצו על 'הוספת מוצר'. מלאו שם, תיאור, מחיר (ומחיר לפני הנחה אם רלוונטי), סוג היהלום (טבעי/מעבדה) וקטגוריה. הוסיפו תמונה ראשית ותמונה משנית להחלפה במעבר עכבר בחנות.",
        tip: "מחיר לפני הנחה גורם להצגת תג 'מבצע' ולמחיר מחוק באתר.",
      },
      {
        title: "עריכה ושכפול",
        body: "כל שורה בטבלה כוללת כפתורי עריכה ושכפול. שכפול יוצר עותק מלא של המוצר — נוח להעלאת וריאציות (גודל/צבע) במהירות.",
      },
      {
        title: "חיפוש וסינון",
        body: "סרגל הכלים מאפשר חיפוש חופשי, סינון לפי קטגוריה ומיון. כך מוצאים פריט גם כשהמלאי גדול.",
      },
      {
        title: "מחיקת מוצר",
        body: "לחיצה על סמל הפח פותחת חלון אישור. המחיקה מתבצעת רק לאחר אישור — ואינה הפיכה.",
        tip: "במקום למחוק פריט שאזל זמנית, שקלו לערוך אותו — כך תשמרו את הנתונים וההיסטוריה.",
      },
    ],
  },
  {
    id: "orders",
    label: "הזמנות",
    icon: ClipboardList,
    summary: "צפייה בהזמנות, עדכון סטטוס ומעקב אחר פרטי הלקוח והפריטים.",
    link: { href: "/workspace/orders", label: "פתיחת ההזמנות" },
    steps: [
      {
        title: "צפייה בפרטי הזמנה",
        body: "כל שורה מציגה את שם הלקוח, הטלפון, התאריך והסכום. לחיצה על 'פריטים' פותחת חלון עם פירוט הפריטים שהוזמנו וכמויות.",
      },
      {
        title: "עדכון סטטוס",
        body: "בעמודת הסטטוס בחרו בין 'ממתינה לתשלום', 'שולמה' ו'נשלחה'. השינוי נשמר מיידית ומסונכרן עם לוח הבקרה.",
        tip: "סננו לפי 'ממתינה' כדי לראות קודם את ההזמנות שדורשות טיפול.",
      },
      {
        title: "חיפוש הזמנה",
        body: "השתמשו בסרגל הכלים לחיפוש לפי שם או טלפון של לקוח כדי לאתר הזמנה ספציפית במהירות.",
      },
    ],
  },
  {
    id: "customers",
    label: "לקוחות",
    icon: Users,
    summary: "ניהול מאגר הלקוחות — הוספה, עריכה, מחיקה וייבוא רשימות.",
    link: { href: "/workspace/customers", label: "פתיחת רשימת הלקוחות" },
    steps: [
      {
        title: "הוספת לקוח",
        body: "לחצו על 'הוספת לקוח' והזינו שם מלא (חובה), דוא\"ל וטלפון. הלקוח נשמר מיד ומופיע ברשימה.",
      },
      {
        title: "ייבוא רשימת לקוחות",
        body: "השתמשו באזור הייבוא כדי להעלות רשימה קיימת בבת אחת — חוסך הזנה ידנית של לקוחות רבים.",
      },
      {
        title: "עריכה ומחיקה",
        body: "מכל שורה ניתן לערוך את פרטי הלקוח או למחוק אותו. המחיקה מחייבת אישור בחלון ייעודי.",
        tip: "מאגר לקוחות מסודר משמש בהמשך לשליחת קמפיינים שיווקיים ממוקדים.",
      },
    ],
  },
  {
    id: "inquiries",
    label: "פניות",
    icon: MessageSquare,
    summary: "טיפול בפניות שהתקבלו מטופס 'צור קשר' באתר.",
    link: { href: "/workspace/inquiries", label: "פתיחת הפניות" },
    steps: [
      {
        title: "קריאת פנייה",
        body: "כל פנייה מציגה שם, טלפון, נושא, תוכן ההודעה ותאריך. תג הסטטוס מציין אם היא 'ממתינה' או 'טופלה'.",
      },
      {
        title: "סימון כטופלה",
        body: "לאחר שחזרתם ללקוח, לחצו על 'סמן כטופל'. הפנייה תעבור לסטטוס 'טופלה' ותרד מרשימת ההמתנה.",
        tip: "טפלו בפניות מוקדם — מענה מהיר מגדיל את הסיכוי לסגירת עסקה.",
      },
    ],
  },
  {
    id: "marketing",
    label: "שיווק",
    icon: Megaphone,
    summary: "יצירה וניהול של קמפיינים שיווקיים בדוא\"ל ו-SMS.",
    link: { href: "/workspace/marketing", label: "פתיחת השיווק" },
    steps: [
      {
        title: "יצירת קמפיין",
        body: "לחצו על 'קמפיין חדש', בחרו ערוץ (דוא\"ל או SMS), הזינו כותרת ותוכן. הקמפיין נשמר כ'טיוטה' עד לשליחה.",
      },
      {
        title: "תצוגה מקדימה ועריכה",
        body: "לפני השליחה ניתן לפתוח תצוגה מקדימה של ההודעה ולערוך אותה עד שהיא מושלמת.",
      },
      {
        title: "שליחת קמפיין",
        body: "לחצו על 'סימון כנשלח' ואשרו בחלון. בשלב זה מדובר בסימולציה — הדיוור בפועל יחובר בהמשך לשירות שליחה (Resend).",
        tip: "ודאו שמאגר הלקוחות מעודכן לפני שליחה כדי שהקמפיין יגיע לכולם.",
      },
    ],
  },
  {
    id: "invoices",
    label: "חשבוניות",
    icon: FileText,
    summary: "הפקת חשבוניות מס וקבלות ללקוחות, כולל חישוב מע״מ והדפסה.",
    link: { href: "/workspace/invoices", label: "פתיחת החשבוניות" },
    steps: [
      {
        title: "הפקת חשבונית חדשה",
        body: "לחצו על 'חשבונית חדשה'. בחרו סוג מסמך (חשבונית מס או חשבונית מס/קבלה), מלאו את פרטי הלקוח והוסיפו שורות פריט (תיאור, כמות ומחיר). מספר החשבונית מוקצה אוטומטית לפי השנה.",
        tip: "אפשר לייבא הזמנה קיימת מהרשימה למעלה — הפרטים והפריטים יתמלאו אוטומטית.",
      },
      {
        title: "מע״מ וסכומים",
        body: "שיעור המע״מ נטען מברירת המחדל שהוגדרה ב'הגדרות האתר', וניתן לשנותו לכל חשבונית. סכום הביניים, המע״מ והסה״כ מחושבים אוטומטית ומוצגים בזמן אמת.",
      },
      {
        title: "צפייה, הדפסה ו-PDF",
        body: "מהרשימה לחצו על סמל המדפסת לפתיחת תצוגת החשבונית. שם תוכלו להדפיס או לשמור כ-PDF (דרך חלון ההדפסה של הדפדפן) — בתצוגה זו מופיעים פרטי העסק שהגדרתם.",
        tip: "עדכנו את פרטי העסק (ח.פ, כתובת, מע״מ) ב'הגדרות האתר' ← 'פרטי עסק וחשבוניות'.",
      },
      {
        title: "סטטוס ומחיקה",
        body: "לכל חשבונית סטטוס: טיוטה, נשלחה, שולמה או בוטלה — שינוי הסטטוס נשמר מיידית. מחיקת חשבונית מתבצעת רק לאחר אישור בחלון ייעודי.",
      },
    ],
  },
  {
    id: "studio",
    label: "סטודיו AI",
    icon: Sparkles,
    summary:
      "הפיכת צילום תכשיט פשוט לתמונת פרסום יוקרתית ולסרטון — בלי לשנות את התכשיט עצמו.",
    link: { href: "/studio", label: "פתיחת סטודיו AI" },
    steps: [
      {
        title: "העלאת צילום מקור",
        body: "התחילו בהעלאת תמונת התכשיט דרך כפתור ההעלאה. צלמו על רקע אחיד (לבן/אפור) והתכשיט במרכז — כך הבידוד יצליח טוב יותר.",
        tip: "ניגודיות גבוהה בין התכשיט לרקע = תוצאה נקייה יותר.",
      },
      {
        title: "יצירת תמונת יוקרה",
        body: "המערכת מסירה את הרקע (הסרת רקע), בונה רקע יוקרתי לפי הסגנון שבחרתם, ומרכיבה את התכשיט המקורי על הרקע. התכשיט עצמו לעולם אינו 'מומצא מחדש' — הפיקסלים שלו נשמרים במדויק.",
      },
      {
        title: "כיוונון סגנון ותאורה",
        body: "בחרו סגנון רקע (שיש יוקרתי, קטיפה שחורה, סטודיו לבן, בוקה זהב, לייפסטייל) והוסיפו הנחיית תאורה חופשית בעברית — היא מתורגמת אוטומטית ומשפיעה על גוון הרקע בלבד.",
      },
      {
        title: "יצירת סרטון",
        body: "ניתן להפיק סרטון תנועה עדין סביב התכשיט (מנוע Kling, עם גיבוי אוטומטי ל-SVD). בחרו אורך (5/10 שניות) ומצב (רגיל/מקצועי).",
      },
      {
        title: "שמירה ופרסום",
        body: "שמרו את התוצאה ל-Cloudinary, ואז פרסמו אותה ישירות כתמונת מוצר חדש בקטלוג, או כתמונה באתר (כגון תמונת קולקציה). אפשר גם להוריד או להעתיק את הקישור.",
        tip: "אפשר להשתמש בתוצאה כמקור חדש כדי להמשיך ולשפר בשכבות.",
      },
    ],
  },
  {
    id: "settings",
    label: "הגדרות האתר",
    icon: Settings,
    summary: "עריכת כל הטקסטים והתמונות באתר — בלי לגעת בקוד.",
    link: { href: "/workspace/settings", label: "פתיחת הגדרות האתר" },
    steps: [
      {
        title: "עריכת תוכן",
        body: "המסך מחולק לאזורים: כותרת ראשית (Hero), מבצעים, קולקציות, אמון ושירות, אודות, יצירת קשר ופוטר. ערכו כל שדה ושמרו — השינוי מתעדכן באתר.",
      },
      {
        title: "החלפת תמונות",
        body: "לכל אזור עם תמונה (Hero, קולקציות, אודות) יש שדה העלאת תמונה. התמונות נשמרות ב-Cloudinary ומוצגות מיד באתר.",
        tip: "אם משאירים שדה ריק — האתר מציג את ערך ברירת המחדל, כך שלא נוצרת 'שבירה'.",
      },
      {
        title: "שמות הקולקציות",
        body: "ניתן לשנות את שם כל קטגוריה (טבעות, אירוסין, צמידים וכו'). השם מתעדכן בתפריט, בפוטר ובעמודי הקולקציה.",
      },
    ],
  },
  {
    id: "compliance",
    label: "נגישות ותקינה",
    icon: ShieldCheck,
    summary: "כלי הנגישות והעמודים המשפטיים שמגנים על האתר ועל הגולשים.",
    steps: [
      {
        title: "בועת הנגישות",
        body: "בכל עמוד באתר הציבורי מופיעה בועת נגישות (פינה תחתונה) המאפשרת לגולשים להגדיל טקסט, להפעיל ניגודיות, להדגיש קישורים, לעצור אנימציות ועוד — בהתאם לתקן האירופאי WCAG 2.1 AA.",
      },
      {
        title: "עמודים משפטיים",
        body: "האתר כולל הצהרת נגישות, מדיניות פרטיות (GDPR) ותקנון — כולם מקושרים מהפוטר. ודאו שפרטי העסק בהם מעודכנים (ח.פ., כתובת, רכז נגישות).",
        tip: "בעת הכניסה הראשונה מוצג לגולש באנר הסכמה לעוגיות, כנדרש בתקינה האירופאית.",
      },
    ],
  },
];

export function HelpWizard() {
  const [activeId, setActiveId] = React.useState(TOPICS[0].id);
  const [stepIndex, setStepIndex] = React.useState(0);
  const [query, setQuery] = React.useState("");

  const topic = TOPICS.find((t) => t.id === activeId) ?? TOPICS[0];

  const filteredTopics = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOPICS;
    return TOPICS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.steps.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.body.toLowerCase().includes(q)
        )
    );
  }, [query]);

  function selectTopic(id: string) {
    setActiveId(id);
    setStepIndex(0);
  }

  const step = topic.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === topic.steps.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* ניווט נושאים */}
      <aside className="space-y-3">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש בנושאי העזרה..."
            aria-label="חיפוש בנושאי העזרה"
            className="rounded-none pr-9"
          />
        </div>

        <nav aria-label="נושאי עזרה" className="flex flex-col gap-1">
          {filteredTopics.map((t) => {
            const active = t.id === activeId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTopic(t.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-center gap-3 border-r-2 px-4 py-3 text-right text-sm font-light transition-colors",
                  active
                    ? "border-gold bg-muted font-normal text-foreground"
                    : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <t.icon aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
          {filteredTopics.length === 0 && (
            <p className="px-4 py-6 text-center text-xs font-light text-muted-foreground">
              לא נמצאו תוצאות לחיפוש
            </p>
          )}
        </nav>
      </aside>

      {/* תוכן הנושא */}
      <section className="border border-border/60 bg-background">
        <header className="border-b border-border/60 bg-muted/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background">
                <topic.icon aria-hidden className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div>
                <h2 className="font-serif text-2xl font-light tracking-wide">
                  {topic.label}
                </h2>
                <p className="mt-1 text-sm font-light text-muted-foreground">
                  {topic.summary}
                </p>
              </div>
            </div>
            {topic.link && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden shrink-0 rounded-none text-xs tracking-[0.08em] sm:inline-flex"
              >
                <Link href={topic.link.href}>
                  <ExternalLink aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                  {topic.link.label}
                </Link>
              </Button>
            )}
          </div>
        </header>

        <div className="p-6 sm:p-8">
          {/* מחוון שלבים */}
          <div className="mb-6 flex items-center gap-2" aria-hidden>
            {topic.steps.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStepIndex(i)}
                aria-label={`מעבר לשלב ${i + 1}`}
                className={cn(
                  "h-1.5 flex-1 transition-colors",
                  i === stepIndex
                    ? "bg-gold"
                    : i < stepIndex
                      ? "bg-gold/40"
                      : "bg-border"
                )}
              />
            ))}
          </div>

          <p className="text-xs font-light tracking-[0.15em] text-gold-dark">
            שלב {stepIndex + 1} מתוך {topic.steps.length}
          </p>

          <h3 className="mt-3 font-serif text-xl font-medium tracking-wide">
            {step.title}
          </h3>
          <p className="mt-3 text-[15px] font-light leading-relaxed text-foreground/85">
            {step.body}
          </p>

          {step.tip && (
            <div className="mt-5 flex items-start gap-3 border border-gold/30 bg-gold/5 p-4">
              <Lightbulb
                aria-hidden
                className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark"
                strokeWidth={1.5}
              />
              <p className="text-sm font-light leading-relaxed text-foreground/80">
                <span className="font-medium text-gold-dark">טיפ: </span>
                {step.tip}
              </p>
            </div>
          )}

          {/* ניווט שלבים */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-6">
            <Button
              type="button"
              variant="ghost"
              disabled={isFirst}
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="rounded-none text-xs tracking-[0.08em]"
            >
              <ArrowRight aria-hidden className="ml-1.5 h-4 w-4" />
              הקודם
            </Button>

            {topic.link && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-none text-xs tracking-[0.08em] sm:hidden"
              >
                <Link href={topic.link.href}>
                  <ExternalLink aria-hidden className="ml-1.5 h-3.5 w-3.5" />
                  למסך
                </Link>
              </Button>
            )}

            <Button
              type="button"
              disabled={isLast}
              onClick={() =>
                setStepIndex((i) => Math.min(topic.steps.length - 1, i + 1))
              }
              className="rounded-none text-xs tracking-[0.08em]"
            >
              הבא
              <ArrowLeft aria-hidden className="mr-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
