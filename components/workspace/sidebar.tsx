import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/workspace/sidebar-nav";

/**
 * סרגל צד קבוע לדסקטופ — מוצמד לימין (האפליקציה ב־RTL,
 * לכן border-l מפריד בינו לבין התוכן שמשמאלו).
 */
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-l border-border/60 bg-background lg:flex print:hidden">
      <div className="px-7 pb-6 pt-8">
        <Link href="/" className="block">
          <span className="block font-serif text-xl font-light tracking-[0.15em]">
            ירושלמי
          </span>
          <span className="block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            Diamonds · ניהול
          </span>
        </Link>
      </div>

      <Separator className="bg-border/60" />

      <div className="flex-1 overflow-y-auto py-6">
        <SidebarNav />
      </div>

      <Separator className="bg-border/60" />

      <p className="px-7 py-5 text-[10px] font-light tracking-widest text-muted-foreground">
        © {new Date().getFullYear()} ירושלמי יהלומים
      </p>
    </aside>
  );
}
