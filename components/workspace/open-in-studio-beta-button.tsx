import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

/** מחזיר נכס שמור בספריית התוכן בחזרה לסטודיו בטא, כתמונת מקור חדשה */
export function OpenInStudioBetaButton({ url }: { url: string }) {
  return (
    <Button
      asChild
      type="button"
      variant="outline"
      size="sm"
      className="rounded-none text-xs font-light"
    >
      <Link href={`/studio-beta?source=${encodeURIComponent(url)}`}>
        <FlaskConical className="ml-1.5 h-3.5 w-3.5" />
        פתיחה בסטודיו בטא
      </Link>
    </Button>
  );
}
