"use client";

import * as React from "react";
import Link from "next/link";
import {
  Accessibility,
  Contrast,
  Eye,
  Highlighter,
  Link2,
  MousePointer2,
  Pause,
  RotateCcw,
  Type,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STORAGE_KEY = "yd-a11y-prefs";

/** העדפות נגישות — נשמרות ב-localStorage ומוחלות כ-class על <html> */
type A11yPrefs = {
  fontStep: 0 | 1 | 2 | 3;
  contrast: boolean;
  grayscale: boolean;
  invert: boolean;
  links: boolean;
  readable: boolean;
  bigCursor: boolean;
  noMotion: boolean;
};

const DEFAULT_PREFS: A11yPrefs = {
  fontStep: 0,
  contrast: false,
  grayscale: false,
  invert: false,
  links: false,
  readable: false,
  bigCursor: false,
  noMotion: false,
};

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;
  root.classList.remove(
    "a11y-font-1",
    "a11y-font-2",
    "a11y-font-3"
  );
  if (prefs.fontStep > 0) {
    root.classList.add(`a11y-font-${prefs.fontStep}`);
  }
  root.classList.toggle("a11y-contrast", prefs.contrast);
  root.classList.toggle("a11y-grayscale", prefs.grayscale);
  root.classList.toggle("a11y-invert", prefs.invert);
  root.classList.toggle("a11y-links", prefs.links);
  root.classList.toggle("a11y-readable", prefs.readable);
  root.classList.toggle("a11y-bigcursor", prefs.bigCursor);
  root.classList.toggle("a11y-no-motion", prefs.noMotion);
}

export function AccessibilityWidget() {
  const [open, setOpen] = React.useState(false);
  const [prefs, setPrefs] = React.useState<A11yPrefs>(DEFAULT_PREFS);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // טעינת העדפות שמורות בעלייה
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULT_PREFS, ...JSON.parse(raw) } as A11yPrefs;
        setPrefs(parsed);
        applyPrefs(parsed);
      }
    } catch {
      /* התעלם — ערכי ברירת מחדל */
    }
  }, []);

  // החלה ושמירה בכל שינוי
  const update = React.useCallback((next: A11yPrefs) => {
    setPrefs(next);
    applyPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* התעלם */
    }
  }, []);

  const reset = React.useCallback(() => {
    update(DEFAULT_PREFS);
  }, [update]);

  // סגירה ב-Esc + מלכודת פוקוס בסיסית
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (key: keyof A11yPrefs) => Boolean(prefs[key]);
  const anyActive =
    prefs.fontStep > 0 ||
    Object.entries(prefs).some(([k, v]) => k !== "fontStep" && v === true);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="פתיחת תפריט נגישות"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-charcoal text-ivory shadow-lg ring-1 ring-gold/40 transition-transform duration-300 hover:scale-105 hover:shadow-xl"
      >
        <Accessibility aria-hidden className="h-7 w-7" strokeWidth={1.5} />
        {anyActive && (
          <span
            aria-hidden
            className="absolute -left-0.5 -top-0.5 h-3 w-3 rounded-full bg-gold ring-2 ring-charcoal"
          />
        )}
      </button>

      {open && (
        <>
          <div
            aria-hidden
            className="fixed inset-0 z-[60] bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="הגדרות נגישות"
            className="fixed bottom-24 right-6 z-[61] flex max-h-[80vh] w-[min(92vw,360px)] flex-col overflow-hidden border border-gold/30 bg-background text-foreground shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border bg-charcoal px-5 py-4 text-ivory">
              <h2 className="flex items-center gap-2 font-serif text-lg font-medium tracking-wide">
                <Accessibility aria-hidden className="h-5 w-5 text-gold" />
                תפריט נגישות
              </h2>
              <button
                type="button"
                aria-label="סגירת תפריט נגישות"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center text-ivory/80 hover:text-gold-light"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {/* גודל טקסט */}
              <div className="mb-5">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Type aria-hidden className="h-4 w-4 text-gold-dark" />
                  גודל טקסט
                </p>
                <div className="flex items-center gap-2" role="group" aria-label="גודל טקסט">
                  {[0, 1, 2, 3].map((step) => (
                    <button
                      key={step}
                      type="button"
                      aria-pressed={prefs.fontStep === step}
                      onClick={() =>
                        update({ ...prefs, fontStep: step as A11yPrefs["fontStep"] })
                      }
                      className={cn(
                        "flex h-11 flex-1 items-center justify-center border text-sm transition-colors",
                        prefs.fontStep === step
                          ? "border-gold bg-gold/15 font-semibold text-gold-dark"
                          : "border-border hover:border-gold/60"
                      )}
                    >
                      {step === 0 ? "רגיל" : `+${step}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* כפתורי מצב */}
              <div className="grid grid-cols-2 gap-2">
                <ToggleButton
                  icon={<Contrast aria-hidden className="h-4 w-4" />}
                  label="ניגודיות גבוהה"
                  active={isActive("contrast")}
                  onClick={() => update({ ...prefs, contrast: !prefs.contrast })}
                />
                <ToggleButton
                  icon={<Eye aria-hidden className="h-4 w-4" />}
                  label="גווני אפור"
                  active={isActive("grayscale")}
                  onClick={() => update({ ...prefs, grayscale: !prefs.grayscale })}
                />
                <ToggleButton
                  icon={<Contrast aria-hidden className="h-4 w-4" />}
                  label="היפוך צבעים"
                  active={isActive("invert")}
                  onClick={() => update({ ...prefs, invert: !prefs.invert })}
                />
                <ToggleButton
                  icon={<Link2 aria-hidden className="h-4 w-4" />}
                  label="הדגשת קישורים"
                  active={isActive("links")}
                  onClick={() => update({ ...prefs, links: !prefs.links })}
                />
                <ToggleButton
                  icon={<Highlighter aria-hidden className="h-4 w-4" />}
                  label="גופן קריא"
                  active={isActive("readable")}
                  onClick={() => update({ ...prefs, readable: !prefs.readable })}
                />
                <ToggleButton
                  icon={<MousePointer2 aria-hidden className="h-4 w-4" />}
                  label="סמן גדול"
                  active={isActive("bigCursor")}
                  onClick={() => update({ ...prefs, bigCursor: !prefs.bigCursor })}
                />
                <ToggleButton
                  icon={<Pause aria-hidden className="h-4 w-4" />}
                  label="עצירת אנימציות"
                  active={isActive("noMotion")}
                  onClick={() => update({ ...prefs, noMotion: !prefs.noMotion })}
                />
              </div>

              <button
                type="button"
                onClick={reset}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-border py-2.5 text-sm font-light transition-colors hover:border-destructive hover:text-destructive"
              >
                <RotateCcw aria-hidden className="h-4 w-4" />
                איפוס הגדרות נגישות
              </button>
            </div>

            <div className="border-t border-border px-5 py-3 text-center">
              <Link
                href="/accessibility"
                onClick={() => setOpen(false)}
                className="text-xs font-light text-muted-foreground underline-offset-4 hover:text-gold-dark hover:underline"
              >
                הצהרת הנגישות שלנו
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ToggleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center gap-1.5 border p-2 text-center text-xs leading-tight transition-colors",
        active
          ? "border-gold bg-gold/15 font-medium text-gold-dark"
          : "border-border hover:border-gold/60"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
