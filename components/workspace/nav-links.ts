import {
  ClipboardList,
  FileText,
  FolderHeart,
  Gem,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type WorkspaceNavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const WORKSPACE_NAV_LINKS: WorkspaceNavLink[] = [
  { label: "לוח בקרה", href: "/workspace", icon: LayoutDashboard },
  { label: "ניהול מלאי", href: "/workspace/products", icon: Gem },
  {
    label: "ספריית תוכן AI",
    href: "/workspace/content-library",
    icon: FolderHeart,
  },
  { label: "הזמנות", href: "/workspace/orders", icon: ClipboardList },
  { label: "חשבוניות", href: "/workspace/invoices", icon: FileText },
  { label: "לקוחות", href: "/workspace/customers", icon: Users },
  { label: "פניות", href: "/workspace/inquiries", icon: MessageSquare },
  { label: "שיווק", href: "/workspace/marketing", icon: Megaphone },
  { label: "סטודיו AI", href: "/studio", icon: Sparkles },
  { label: "הגדרות האתר", href: "/workspace/settings", icon: Settings },
  { label: "מדריך והדרכה", href: "/workspace/help", icon: LifeBuoy },
];
