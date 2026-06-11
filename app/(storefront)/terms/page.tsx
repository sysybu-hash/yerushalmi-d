import type { Metadata } from "next";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "תקנון ותנאי שימוש",
  description: "תקנון האתר, תנאי הרכישה, המשלוח, האחריות והביטולים של ירושלמי יהלומים.",
};

export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <LegalPage title="תקנון ותנאי שימוש" updatedAt="יוני 2026">
      <p>
        השימוש באתר ירושלמי יהלומים וביצוע רכישות כפופים לתנאים המפורטים להלן.
        הגלישה והשימוש באתר מהווים הסכמה לתקנון זה.
      </p>

      <LegalSection heading="המוצרים והמחירים">
        <p>
          התמונות באתר נועדו להמחשה. ייתכנו הבדלים בגוון ובגודל בין התצוגה למוצר
          בפועל. המחירים כוללים מע&quot;מ כחוק ונקובים בשקלים חדשים. החברה רשאית
          לעדכן מחירים ומלאי מעת לעת.
        </p>
      </LegalSection>

      <LegalSection heading="הזמנה ותשלום">
        <p>
          לאחר שליחת הזמנה ניצור עמכם קשר לאישור הפרטים, אופן התשלום והאספקה.
          השלמת ההזמנה כפופה לאישור החברה ולזמינות הפריט.
        </p>
      </LegalSection>

      <LegalSection heading="משלוח ואיסוף">
        <p>
          ניתן לבחור במשלוח עד בית הלקוח או באיסוף עצמי. זמני האספקה יתואמו אישית
          מול הלקוח. שירות עד בית הלקוח זמין בהתאם לאזורי השירות.
        </p>
      </LegalSection>

      <LegalSection heading="אחריות ותעודה גימולוגית">
        <p>
          כל תכשיט מלווה באחריות מלאה ובתעודה גימולוגית בהתאם לפריט. אנו מתחייבים
          לאיכות, למקצועיות ולשקיפות מלאה לגבי מאפייני היהלום.
        </p>
      </LegalSection>

      <LegalSection heading="ביטול עסקה והחזרות">
        <p>
          ביטול עסקה יתבצע בהתאם לחוק הגנת הצרכן התשמ&quot;א-1981 ולתקנותיו. יובהר
          כי על טובין שיוצרו או הותאמו במיוחד עבור הלקוח (עיצוב אישי) עשויות לחול
          מגבלות על זכות הביטול בהתאם לדין. לפרטים ולתיאום ניתן לפנות לשירות
          הלקוחות.
        </p>
      </LegalSection>

      <LegalSection heading="קניין רוחני">
        <p>
          כל התכנים, התמונות והעיצוב באתר הם קניינה של ירושלמי יהלומים ואין לעשות
          בהם שימוש ללא אישור בכתב.
        </p>
      </LegalSection>

      <LegalSection heading="יצירת קשר">
        <p>
          לשאלות בנוגע לתקנון ניתן לפנות בטלפון{" "}
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
