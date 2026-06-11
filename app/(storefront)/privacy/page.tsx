import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "מדיניות פרטיות",
  description: "מדיניות הפרטיות של ירושלמי יהלומים בהתאם לתקנות הגנת הפרטיות ו-GDPR.",
};

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <LegalPage title="מדיניות פרטיות" updatedAt="יוני 2026">
      <p>
        ירושלמי יהלומים (&quot;אנחנו&quot;, &quot;החברה&quot;) מכבדת את פרטיות
        המבקרים והלקוחות באתר. מדיניות זו מסבירה איזה מידע נאסף, כיצד הוא נשמר
        ומשמש, ומהן זכויותיכם בהתאם לחוק הגנת הפרטיות התשמ&quot;א-1981 ולתקנת
        הגנת המידע האירופאית (GDPR) ככל שהיא חלה.
      </p>

      <LegalSection heading="איזה מידע אנו אוספים">
        <ul className="list-disc space-y-2 pr-5">
          <li>
            מידע שאתם מוסרים מרצונכם בטפסי יצירת קשר והזמנה: שם מלא, מספר טלפון,
            כתובת דוא&quot;ל, כתובת למשלוח והערות.
          </li>
          <li>פרטי הזמנה: הפריטים שנרכשו, סכום ההזמנה ואופן האספקה.</li>
          <li>
            מידע טכני בסיסי הנדרש לתפעול האתר ולאבטחתו (עוגיות הכרחיות בלבד).
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="הבסיס החוקי והשימוש במידע">
        <p>
          אנו משתמשים במידע לצורך מתן שירות, עיבוד הזמנות, יצירת קשר חוזר, ומענה
          לפניות. הבסיס החוקי לעיבוד הוא ביצוע התקשרות לבקשתכם, הסכמתכם, ואינטרס
          לגיטימי בניהול העסק. איננו מוכרים מידע אישי לצדדים שלישיים.
        </p>
      </LegalSection>

      <LegalSection heading="עוגיות (Cookies)">
        <p>
          האתר עושה שימוש בעוגיות הכרחיות לתפעול תקין ולשמירת העדפות (כגון תוכן
          סל הקניות והעדפות נגישות). איננו טוענים כיום עוגיות פרסום או מעקב צד
          שלישי. בעת הכניסה הראשונה תוצג הודעת עוגיות לאישורכם.
        </p>
      </LegalSection>

      <LegalSection heading="שמירת המידע ואבטחתו">
        <p>
          המידע נשמר במאגרים מאובטחים ולמשך הזמן הנדרש למטרות שלשמן נאסף או על פי
          דרישות הדין. אנו נוקטים אמצעי אבטחה סבירים להגנה מפני גישה, שינוי או
          חשיפה בלתי מורשים.
        </p>
      </LegalSection>

      <LegalSection heading="זכויותיכם">
        <p>
          בהתאם לדין, עומדת לכם הזכות לעיין במידע שנאסף עליכם, לבקש את תיקונו או
          מחיקתו, להגביל או להתנגד לעיבוד, ולמשוך הסכמה שניתנה. למימוש הזכויות
          ניתן לפנות אלינו.
        </p>
      </LegalSection>

      <LegalSection heading="יצירת קשר">
        <p>
          לשאלות או בקשות בנושא פרטיות ניתן לפנות בטלפון{" "}
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
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
