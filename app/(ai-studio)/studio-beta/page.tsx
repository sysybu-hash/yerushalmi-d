import { Suspense } from "react";
import { StudioBetaApp } from "@/components/studio-beta/studio-beta-app";
import { isReplicateConfigured } from "@/lib/studio-beta/replicate-client";
import { isGeminiConfigured } from "@/lib/studio-beta/gemini-client";

export const dynamic = "force-dynamic";

/**
 * Server Component בכוונה: זיהוי אילו ספקים מוגדרים חייב לקרוא משתני
 * סביבה בצד שרת (הם undefined בדפדפן) ולהעביר את התוצאה כ-prop לעץ
 * הלקוח, במקום שרכיבי הלקוח ינסו לבדוק בעצמם.
 */
export default function StudioBetaPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  const providers = {
    replicate: isReplicateConfigured(),
    gemini: isGeminiConfigured(),
  };

  return (
    // Suspense נדרש כי StudioBetaApp משתמש ב-useSearchParams (סנכרון שלב <-> URL)
    <Suspense>
      <StudioBetaApp
        providers={providers}
        initialSourceUrl={searchParams.source ?? null}
      />
    </Suspense>
  );
}
