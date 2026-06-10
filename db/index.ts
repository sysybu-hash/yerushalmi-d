import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

/**
 * אתחול עצלן: החיבור נוצר רק בשאילתה הראשונה בפועל,
 * כך שהיעדר DATABASE_URL לא מפיל את תהליך הבנייה (למשל ב־Vercel
 * לפני שהוגדרו משתני הסביבה) — אלא רק בקשה אמיתית בזמן ריצה.
 */
let _db: NeonHttpDatabase<typeof schema> | null = null;

function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — add it to .env.local");
    }
    const sql = neon(process.env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop, receiver) {
      const value = Reflect.get(getDb(), prop, receiver);
      return typeof value === "function" ? value.bind(getDb()) : value;
    },
  }
);
