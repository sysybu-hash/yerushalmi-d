import type { Metadata } from "next";

import { HelpWizard } from "@/components/workspace/help-wizard";

export const metadata: Metadata = {
  title: "מדריך והדרכה",
};

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">
          מדריך והדרכה
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          אשף מקצועי המסביר צעד-אחר-צעד את כל פעולות החנות, הניהול וסטודיו ה-AI
        </p>
      </div>

      <HelpWizard />
    </div>
  );
}
