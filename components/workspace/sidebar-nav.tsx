"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { WORKSPACE_NAV_LINKS } from "@/components/workspace/nav-links";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {WORKSPACE_NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/workspace"
            ? pathname === "/workspace"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-light transition-colors",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" strokeWidth={1.5} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
