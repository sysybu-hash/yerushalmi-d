import {
  ClipboardList,
  Gem,
  LayoutDashboard,
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
  { label: "הזמנות", href: "/workspace/orders", icon: ClipboardList },
  { label: "לקוחות", href: "/workspace/customers", icon: Users },
  { label: "פניות", href: "/workspace/inquiries", icon: MessageSquare },
  { label: "שיווק", href: "/workspace/marketing", icon: Megaphone },
  { label: "סטודיו AI", href: "/studio", icon: Sparkles },
  { label: "הגדרות האתר", href: "/workspace/settings", icon: Settings },
];
