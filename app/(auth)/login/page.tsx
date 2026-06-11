"use client";

import * as React from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Eye, EyeOff, Gem, Loader2, XCircle } from "lucide-react";

import { login, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-none bg-stone-100 text-xs font-light tracking-[0.2em] text-stone-900 hover:bg-stone-300"
    >
      {pending ? (
        <>
          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          מתחבר...
        </>
      ) : (
        "כניסה"
      )}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useFormState<LoginState, FormData>(login, null);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-800 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_55%)]"
      />

      <div className="relative w-full max-w-sm border border-stone-700/60 bg-stone-950/60 p-10 text-stone-50 backdrop-blur-sm">
        <div className="text-center">
          <Gem
            aria-hidden
            className="mx-auto h-8 w-8 text-stone-300"
            strokeWidth={0.75}
          />
          <h1 className="mt-4 font-serif text-2xl font-light tracking-[0.15em]">
            ירושלמי
          </h1>
          <p className="mt-1 text-[9px] uppercase tracking-[0.5em] text-stone-400">
            Diamonds
          </p>
        </div>

        <Separator className="my-8 bg-stone-700/60" />

        <h2 className="text-center font-serif text-lg font-light tracking-wide">
          כניסה לאזור האישי
        </h2>

        <form action={formAction} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-light text-stone-300">
              אימייל
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              className="rounded-none border-stone-700 bg-stone-900/60 text-stone-100 placeholder:text-stone-500 focus-visible:ring-stone-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-light text-stone-300">
              סיסמה
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                dir="ltr"
                className="rounded-none border-stone-700 bg-stone-900/60 pl-10 text-stone-100 placeholder:text-stone-500 focus-visible:ring-stone-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {state?.error && (
            <p className="flex items-center gap-1.5 text-xs font-light text-red-400">
              <XCircle className="h-3.5 w-3.5 shrink-0" />
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-light tracking-[0.15em] text-stone-400 transition-colors hover:text-stone-200"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          חזרה לחנות
        </Link>

        <p className="mt-6 text-center text-[10px] font-light tracking-widest text-stone-500">
          הכניסה למנהלי החנות בלבד
        </p>
      </div>
    </main>
  );
}
