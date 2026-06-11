import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/** וידוא שהפעולה מבוצעת על ידי מנהל מחובר */
export async function requireAdmin() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("Unauthorized");
  }

  const { payload } = await jwtVerify(token, getSecret());
  if (payload.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

/** בדיקה שקטה — האם יש סשן מנהל תקף */
export async function isAdminAuthenticated() {
  try {
    await requireAdmin();
    return true;
  } catch {
    return false;
  }
}
