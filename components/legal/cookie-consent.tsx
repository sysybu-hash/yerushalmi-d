"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "yd-cookie-consent";

/**
 * באנר הסכמה לעוגיות לפי הנחיית ePrivacy האירופאית.
 * האתר אינו טוען כיום עוגיות לא-הכרחיות (אנליטיקה/פרסום),
 * לכן הבאנר מיידע ושומר את בחירת המשתמש לקראת הרחבות עתידיות.
 */
export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      /* התעלם */
    }
  }, []);

  const decide = React.useCallback((choice: "all" | "essential") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() })
      );
    } catch {
      /* התעלם */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="הודעת עוגיות"
      className="fixed bottom-0 left-0 right-0 z-[55] border-t border-gold/30 bg-charcoal/98 px-4 py-5 text-ivory shadow-2xl backdrop-blur-md sm:px-8"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Cookie
            aria-hidden
            className="mt-0.5 h-5 w-5 shrink-0 text-gold"
            strokeWidth={1.5}
          />
          <p className="text-xs font-light leading-relaxed text-ivory/85">
            אנו משתמשים בעוגיות הכרחיות לתפעול האתר ולשיפור חוויית הגלישה. ניתן
            לקרוא עוד ב
            <Link
              href="/privacy"
              className="mx-1 text-gold-light underline underline-offset-2 hover:text-gold"
            >
              מדיניות הפרטיות
            </Link>
            שלנו.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("essential")}
            className="min-h-[44px] border border-ivory/40 px-4 text-xs font-light tracking-[0.1em] text-ivory transition-colors hover:border-gold-light hover:text-gold-light"
          >
            הכרחי בלבד
          </button>
          <button
            type="button"
            onClick={() => decide("all")}
            className="min-h-[44px] bg-gold px-5 text-xs font-medium tracking-[0.1em] text-charcoal transition-colors hover:bg-gold-light"
          >
            אישור הכל
          </button>
        </div>
      </div>
    </div>
  );
}
