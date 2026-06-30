import type { Metadata } from "next";

import { Sidebar } from "@/components/workspace/sidebar";
import { Topbar } from "@/components/workspace/topbar";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "אזור ניהול",
};

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* ב־RTL האלמנט הראשון ב־flex מוצמד לימין — הסרגל יושב בצד ימין */}
      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
