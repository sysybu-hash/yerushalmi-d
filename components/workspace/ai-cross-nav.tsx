import Link from "next/link";
import { FlaskConical, FolderHeart, LayoutDashboard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AiCrossNavProps = {
  current: "studio" | "studio-beta" | "content-library";
  className?: string;
};

/** ניווט מהיר בין סטודיו AI, סטודיו בטא, ספריית תוכן וניהול */
export function AiCrossNav({ current, className }: AiCrossNavProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      aria-label="ניווט AI"
    >
      <Button
        asChild
        variant={current === "studio" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-none text-xs font-light tracking-[0.08em]"
      >
        <Link href="/studio">
          <Sparkles className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          סטודיו AI
        </Link>
      </Button>
      <Button
        asChild
        variant={current === "studio-beta" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-none text-xs font-light tracking-[0.08em]"
      >
        <Link href="/studio-beta">
          <FlaskConical className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          סטודיו בטא
        </Link>
      </Button>
      <Button
        asChild
        variant={current === "content-library" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-none text-xs font-light tracking-[0.08em]"
      >
        <Link href="/workspace/content-library">
          <FolderHeart className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
          ספריית תוכן
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="rounded-none text-xs font-light tracking-[0.08em]"
      >
        <Link href="/workspace">
          <LayoutDashboard className="ml-1.5 h-3.5 w-3.5" />
          ניהול
        </Link>
      </Button>
    </nav>
  );
}
