"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadZoneProps = {
  onUploaded: (url: string) => void;
  className?: string;
  compact?: boolean;
};

type UploadState = "idle" | "uploading" | "error";

/**
 * ממשק העלאה עצמאי בעברית מלאה — מחליף את ה-Upload Widget המוטמע של
 * Cloudinary (נבדק בפועל: לא תומך בעברית, גם עם options.language). מעלה
 * דרך app/api/studio-beta/upload/route.ts שעוטף את uploadToCloudinary
 * הקיים.
 */
export function UploadZone({ onUploaded, className, compact }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState("uploading");
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/studio-beta/upload", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();
      if (!json.ok) throw new Error(json.error ?? "ההעלאה נכשלה");
      onUploaded(json.url);
      setState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ההעלאה נכשלה — נסו שוב");
      setState("error");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isLoading = state === "uploading";

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 border border-dashed border-gold/40 bg-gold/5 px-6 py-12 text-center transition-colors hover:border-gold hover:bg-gold/10 disabled:opacity-50",
          isDragging && "border-gold bg-gold/10",
          compact && "py-6",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-gold-dark" />
        ) : (
          <ImagePlus className="h-8 w-8 text-gold-dark" strokeWidth={1} />
        )}
        <div className="space-y-1">
          <p className="font-serif text-base font-light">
            {compact ? "החלפת תמונה" : "העלאת תמונת תכשיט"}
          </p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            גררו לכאן קובץ או לחצו לבחירה
          </p>
        </div>
      </button>
      {state === "error" && error && (
        <p className="flex items-center gap-1.5 text-xs font-light text-destructive">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
