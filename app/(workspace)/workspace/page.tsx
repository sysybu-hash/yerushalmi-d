import { Gem, ShoppingBag, TrendingUp, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/workspace/stat-card";

// נתוני דמה — יוחלפו בשאילתות Drizzle מול Neon בשלב הבא
const STATS = [
  {
    title: "סך הכל הכנסות החודש",
    value: "₪486,200",
    hint: "+12.4% מהחודש הקודם",
    icon: TrendingUp,
    trend: "up" as const,
  },
  {
    title: "לקוחות חדשים",
    value: "38",
    hint: "+8 מהחודש הקודם",
    icon: Users,
    trend: "up" as const,
  },
  {
    title: "תכשיטים במלאי",
    value: "214",
    hint: "12 קטגוריות פעילות",
    icon: Gem,
  },
  {
    title: "הזמנות פתוחות",
    value: "17",
    hint: "5 ממתינות למשלוח",
    icon: ShoppingBag,
  },
];

const RECENT_ACTIVITY = [
  { text: "הזמנה חדשה — טבעת אירוסין סוליטר 1.2 קראט", time: "לפני 25 דקות" },
  { text: "לקוחה חדשה נרשמה — שרה לוי", time: "לפני שעתיים" },
  { text: "עודכן מחיר — עגילי יהלום עדינים", time: "לפני 4 שעות" },
  { text: "קמפיין SMS נשלח ל־120 לקוחות", time: "אתמול" },
];

export default function WorkspaceDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light tracking-wide">
          לוח בקרה
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
          סקירה כללית של פעילות החנות — ירושלמי יהלומים
        </p>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* פעילות אחרונה */}
      <Card className="rounded-none border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-light tracking-wide">
            פעילות אחרונה
          </CardTitle>
          <CardDescription className="font-light">
            עדכונים אחרונים מהחנות ומהלקוחות
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {RECENT_ACTIVITY.map((item) => (
              <li
                key={item.text}
                className="flex items-center justify-between gap-4 py-3"
              >
                <span className="text-sm font-light">{item.text}</span>
                <span className="shrink-0 text-xs font-light text-muted-foreground">
                  {item.time}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
