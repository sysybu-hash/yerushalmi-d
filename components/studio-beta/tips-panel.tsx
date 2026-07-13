"use client";

import { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPS = [
  "תמונת מקור חדה ומוארת היטב נותנת תוצאה טובה יותר מכל כיוונון בדיעבד.",
  "מנוע Gemini — הרכבה חכמה בדרך כלל מספיק לרוב התכשיטים בקריאה אחת וזול יותר.",
  "אם הבידוד האוטומטי לא מדויק, נסו מנוע רקע אחר — לפעמים ההבדל בין המנועים משמעותי.",
  "וידאו קצר (4 שניות) מספיק בדרך כלל להצגה נאה ברשתות חברתיות וחוסך עלות.",
  "אפשר תמיד לחזור לפרויקט קודם מהלשונית בשלב ההעלאה, גם אחרי שיצאתם באמצע.",
];

export function TipsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-light tracking-wide text-muted-foreground hover:text-foreground"
      >
        <Lightbulb className="h-3.5 w-3.5 shrink-0 text-gold-dark" strokeWidth={1.5} />
        <span className="flex-1 text-right">טיפים לעבודה עם הסטודיו</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="space-y-1.5 border-t border-border/60 px-3 py-2.5 text-[11px] font-light leading-relaxed text-muted-foreground">
          {TIPS.map((tip) => (
            <li key={tip} className="flex gap-1.5">
              <span aria-hidden>·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
