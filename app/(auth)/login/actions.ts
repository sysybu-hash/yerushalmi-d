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
  const username = formData.get("username")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();

  if (!username || !password) {
    return { error: "יש למלא שם משתמש וסיסמה" };
  }

  const adminUsername = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return { error: "המערכת אינה מוגדרת — חסרים פרטי מנהל בשרת" };
  }

  if (username !== adminUsername || password !== adminPassword) {
    return { error: "שם משתמש או סיסמה שגויים" };
  }

  const token = await new SignJWT({ role: "admin", username })
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
