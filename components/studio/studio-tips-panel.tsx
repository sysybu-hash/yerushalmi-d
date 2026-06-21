"use client";

import { ChevronDown, Lightbulb } from "lucide-react";

const TIPS = [
  "העלו צילום גולמי חד — מינימום 2000×2000, תכשיט במרכז, רקע אחיד (לבן/אפור).",
  "בחרו סגנון רקע — התכשיט נשאר זהה; רק הרקע והתאורה משתנים.",
  "לחצו «עצב בסגנון יוקרתי» — פלט 2048px, ללא AI שממציא תכשיט.",
  "לווידאו: נוצרת תמונת יוקרה תחילה, Kling Pro 1080p, מצלמה קבועה.",
  "שמרו ב-Cloudinary ואז פרסמו ל-Hero, קולקציה או מוצר במלאי.",
];

export function StudioTipsPanel() {
  return (
    <details className="group border border-gold/25 bg-gold/5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-light tracking-[0.08em] text-gold-dark [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 shrink-0" strokeWidth={1.5} />
          הנחיות לעבודה עם ה-AI
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="space-y-2 border-t border-gold/20 px-4 py-3 text-sm font-light leading-relaxed text-foreground/80">
        {TIPS.map((tip, index) => (
          <li key={tip} className="flex gap-2">
            <span className="text-gold-dark tabular-nums">{index + 1}.</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
