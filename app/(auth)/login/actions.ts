"use server";

import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "admin_token";
const SESSION_DAYS = 7;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set — add it to .env.local");
  }
  return new TextEncoder().encode(secret);
}

export type LoginState = { error: string } | null;

/**
 * כניסת מנהל: השוואה מול משתני הסביבה, חתימת JWT
 * ושמירתו בעוגייה HTTP-only למשך 7 ימים.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "יש למלא אימייל וסיסמה" };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return { error: "המערכת אינה מוגדרת — חסרים פרטי מנהל בשרת" };
  }

  if (email !== adminEmail || password !== adminPassword) {
    return { error: "אימייל או סיסמה שגויים" };
  }

  const token = await new SignJWT({ role: "admin", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  redirect("/workspace");
}

/** התנתקות: מחיקת העוגייה וחזרה למסך הכניסה */
export async function logout() {
  cookies().delete(COOKIE_NAME);
  redirect("/login");
}
