"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import {
  ArrowLeft,
  Clapperboard,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";

import {
  generateJewelryVideo,
  generateLuxuryImage,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type StudioState =
  | { status: "empty" }
  | { status: "uploaded"; source: string }
  | { status: "generating"; source: string; kind: "image" | "video" }
  | {
      status: "done";
      source: string;
      kind: "image" | "video";
      result: string;
    }
  | { status: "error"; source: string; message: string };

const LOADING_MESSAGES = {
  image: "ה־AI מעצב עבורך את התכשיט על רקע יוקרתי...",
  video: "ה־AI מפיח חיים בתכשיט — מרנדר קליפ קולנועי...",
};

export default function StudioPage() {
  const [state, setState] = React.useState<StudioState>({ status: "empty" });

  async function generate(kind: "image" | "video") {
    if (!("source" in state) || !state.source) return;
    const source = state.source;

    setState({ status: "generating", source, kind });

    try {
      const { url } =
        kind === "image"
          ? await generateLuxuryImage(source)
          : await generateJewelryVideo(source);

      setState({ status: "done", source, kind, result: url });
    } catch (error) {
      setState({
        status: "error",
        source,
        message:
          error instanceof Error
            ? error.message
            : "היצירה נכשלה — נסו שוב בעוד רגע",
      });
    }
  }

  const source = "source" in state ? state.source : null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* כותרת */}
      <div className="text-center">
        <Sparkles
          aria-hidden
          className="mx-auto h-8 w-8 text-foreground/60"
          strokeWidth={0.75}
        />
        <h1 className="mt-4 font-serif text-3xl font-light tracking-wide sm:text-4xl">
          סטודיו יצירת תוכן AI
        </h1>
        <p className="mt-3 text-sm font-light text-muted-foreground">
          העלו צילום גולמי של תכשיט — וה־AI יהפוך אותו לנכס שיווקי יוקרתי
        </p>
      </div>

      <Separator className="bg-border/60" />

      {/* שלב 1 — העלאה */}
      {!source ? (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
          options={{ maxFiles: 1, multiple: false }}
          onSuccess={(result) => {
            if (
              typeof result.info === "object" &&
              result.info &&
              "secure_url" in result.info
            ) {
              setState({
                status: "uploaded",
                source: result.info.secure_url as string,
              });
            }
          }}
        >
          {({ open }) => (
            <button
              type="button"
              onClick={() => open()}
              className="flex w-full flex-col items-center justify-center gap-4 border border-dashed border-border bg-muted/20 py-24 transition-colors hover:bg-muted/40"
            >
              <ImagePlus
                aria-hidden
                className="h-10 w-10 text-muted-foreground"
                strokeWidth={0.75}
              />
              <span className="font-serif text-xl font-light">
                העלאת צילום גולמי
              </span>
              <span className="text-xs font-light tracking-[0.1em] text-muted-foreground">
                לחצו לבחירת תמונה מהמחשב
              </span>
            </button>
          )}
        </CldUploadWidget>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* המקור */}
          <Card className="rounded-none border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                הצילום המקורי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square overflow-hidden border border-border/60">
                <Image
                  src={source}
                  alt="הצילום הגולמי שהועלה"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* פאנל פעולות */}
              <div className="grid gap-3">
                <Button
                  disabled={state.status === "generating"}
                  onClick={() => generate("image")}
                  className="rounded-none text-xs font-light tracking-[0.15em]"
                >
                  <Wand2 className="ml-2 h-4 w-4" strokeWidth={1.5} />
                  עצב בסגנון יוקרתי
                </Button>
                <Button
                  disabled={state.status === "generating"}
                  onClick={() => generate("video")}
                  variant="outline"
                  className="rounded-none text-xs font-light tracking-[0.15em]"
                >
                  <Clapperboard className="ml-2 h-4 w-4" strokeWidth={1.5} />
                  הפוך לווידאו מנצנץ
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={state.status === "generating"}
                  onClick={() => setState({ status: "empty" })}
                  className="text-xs font-light text-muted-foreground"
                >
                  <RotateCcw className="ml-1.5 h-3.5 w-3.5" />
                  החלפת תמונה
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* התוצאה */}
          <Card className="rounded-none border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light tracking-[0.1em] text-muted-foreground">
                היצירה של ה־AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-border/60 bg-gradient-to-br from-stone-100 to-stone-200">
                {state.status === "generating" && (
                  <div className="flex flex-col items-center gap-4 px-6 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
                    <p className="text-sm font-light leading-relaxed text-muted-foreground">
                      {LOADING_MESSAGES[state.kind]}
                    </p>
                    <p className="text-[11px] font-light tracking-[0.1em] text-muted-foreground">
                      התהליך אורך כדקה — אל תסגרו את החלון
                    </p>
                  </div>
                )}

                {state.status === "done" && state.kind === "image" && (
                  <Image
                    src={state.result}
                    alt="תמונת המוצר שעוצבה על ידי AI"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}

                {state.status === "done" && state.kind === "video" && (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video
                    src={state.result}
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                )}

                {state.status === "error" && (
                  <p className="px-6 text-center text-sm font-light text-destructive">
                    {state.message}
                  </p>
                )}

                {state.status === "uploaded" && (
                  <p className="px-6 text-center text-sm font-light text-muted-foreground">
                    בחרו פעולה כדי להתחיל ביצירה
                  </p>
                )}
              </div>

              {/* דחיפה למלאי — רק לתמונות שהושלמו */}
              {state.status === "done" && state.kind === "image" && (
                <Button
                  asChild
                  className="w-full rounded-none text-xs font-light tracking-[0.15em]"
                >
                  <Link
                    href={`/workspace/products?image_url=${encodeURIComponent(
                      state.result
                    )}`}
                  >
                    <ArrowLeft className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    דחיפה למלאי — יצירת מוצר עם התמונה
                  </Link>
                </Button>
              )}

              {state.status === "done" && state.kind === "video" && (
                <p className="text-center text-xs font-light text-muted-foreground">
                  שמרו את הווידאו (לחיצה ימנית ← שמירה) לשימוש ברשתות החברתיות
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
