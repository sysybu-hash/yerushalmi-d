import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description:
    "הצהרת הנגישות של אתר ירושלמי יהלומים — תאימות לתקן WCAG 2.1 רמה AA ולתקן האירופאי EN 301 549.",
};

export default async function AccessibilityStatementPage() {
  const settings = await getSiteSettings();

  return (
    <LegalPage title="הצהרת נגישות" updatedAt="יוני 2026">
      <p>
        אתר ירושלמי יהלומים רואה חשיבות רבה במתן שירות שוויוני ונגיש לכלל
        הגולשים, לרבות אנשים עם מוגבלות. אנו פועלים להנגשת האתר בהתאם לתקן
        הישראלי ת&quot;י 5568, להנחיות הנגישות הבינלאומיות{" "}
        <span dir="ltr">WCAG 2.1</span> ברמה <span dir="ltr">AA</span>, ולתקן
        האירופאי <span dir="ltr">EN 301 549</span>.
      </p>

      <LegalSection heading="רמת הנגישות באתר">
        <p>
          האתר נבנה בטכנולוגיית <span dir="ltr">HTML</span> סמנטית, עם תמיכה
          מלאה בכיווניות מימין-לשמאל (עברית), ניווט מלא באמצעות מקלדת, חיווי
          פוקוס נראה, טקסט חלופי לתמונות, וקישור &quot;דלג לתוכן&quot;. כותרות
          ושדות טופס מתויגים כראוי לקוראי מסך.
        </p>
      </LegalSection>

      <LegalSection heading="כלי התאמת הנגישות באתר">
        <p>
          בכל עמוד באתר זמין תפריט נגישות (הסמל בפינה התחתונה) המאפשר להתאים את
          התצוגה באופן אישי, ובכלל זה:
        </p>
        <ul className="list-disc space-y-2 pr-5">
          <li>הגדלת גודל הטקסט בשלוש רמות.</li>
          <li>מצב ניגודיות גבוהה.</li>
          <li>תצוגת גווני אפור והיפוך צבעים.</li>
          <li>הדגשת קישורים והחלפה לגופן קריא.</li>
          <li>הגדלת סמן העכבר.</li>
          <li>עצירת אנימציות ותנועה.</li>
        </ul>
        <p>הבחירות נשמרות בדפדפן וניתן לאפס אותן בכל עת.</p>
      </LegalSection>

      <LegalSection heading="מגבלות ידועות">
        <p>
          חרף מאמצינו להנגיש את כלל רכיבי האתר, ייתכן שחלקים מסוימים — בעיקר תוכן
          חיצוני או מדיה מוטמעת — טרם הונגשו במלואם. אנו ממשיכים לשפר את הנגישות
          באופן שוטף.
        </p>
      </LegalSection>

      <LegalSection heading="פנייה ורכז נגישות">
        <p>
          נתקלתם בקושי בגלישה או בבעיית נגישות? נשמח לקבל את פנייתכם ולטפל בה
          בהקדם. ניתן לפנות לרכז הנגישות בטלפון{" "}
          <a
            href={`tel:${settings.contactPhone}`}
            dir="ltr"
            className="text-gold-dark underline underline-offset-2"
          >
            {settings.contactPhone}
          </a>{" "}
          או דרך{" "}
          <a href="/contact" className="text-gold-dark underline underline-offset-2">
            עמוד יצירת הקשר
          </a>
          . בפנייה נא לפרט את הבעיה, העמוד שבו הופיעה והדפדפן שבו נעשה שימוש.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
