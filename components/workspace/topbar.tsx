"use client";

import * as React from "react";
import Link from "next/link";
import { LogOut, Menu, UserRound } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/workspace/sidebar-nav";

export function Topbar() {
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* תפריט המבורגר — מובייל בלבד */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="פתיחת תפריט ניהול"
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.25} />
          </Button>
        </SheetTrigger>

        <SheetContent side="right" className="w-[300px] p-0">
          <SheetHeader className="px-7 pb-4 pt-8 text-right">
            <SheetTitle className="font-serif text-lg font-light tracking-[0.15em]">
              ירושלמי
            </SheetTitle>
            <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Diamonds · ניהול
            </p>
          </SheetHeader>

          <Separator className="bg-border/60" />

          <div className="py-6">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="hidden text-sm font-light tracking-[0.1em] text-muted-foreground lg:block">
        אזור ניהול
      </h1>

      {/* פרופיל משתמש */}
      <DropdownMenu dir="rtl">
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-10 gap-3 px-2 hover:bg-muted"
            aria-label="תפריט משתמש"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-foreground text-xs text-background">
                י״י
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-light sm:block">מנהל/ת</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-light">
            החשבון שלי
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/login" className="cursor-pointer">
              <UserRound className="ml-2 h-4 w-4" strokeWidth={1.5} />
              אזור אישי
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            // TODO: חיבור ללוגיקת התנתקות אמיתית כשספק ההזדהות יחובר
            onSelect={() => (window.location.href = "/")}
          >
            <LogOut className="ml-2 h-4 w-4" strokeWidth={1.5} />
            התנתקות
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
