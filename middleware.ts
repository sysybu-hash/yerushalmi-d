import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "admin_token";

function isStudioApi(pathname: string) {
  return pathname.startsWith("/api/studio/");
}

function studioApiUnauthorized(message: string, status = 401) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function verifyAdminToken(token: string) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET_MISSING");
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jwtVerify(token, secret);
  return payload.role === "admin";
}

/**
 * שומר הסף של אזורי הניהול + מפנה מנהל מחובר מ-/login ל-workspace.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const loginUrl = new URL("/login", request.url);
  const workspaceUrl = new URL("/workspace", request.url);

  if (request.nextUrl.pathname === "/login") {
    if (!token) {
      return NextResponse.next();
    }
    try {
      if (await verifyAdminToken(token)) {
        return NextResponse.redirect(workspaceUrl);
      }
    } catch {
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    return NextResponse.next();
  }

  const studioApi = isStudioApi(request.nextUrl.pathname);

  if (!token) {
    if (studioApi) {
      return studioApiUnauthorized(
        "פג תוקף ההתחברות — התחברו מחדש דרך /login"
      );
    }
    return NextResponse.redirect(loginUrl);
  }

  try {
    if (!(await verifyAdminToken(token))) {
      if (studioApi) {
        return studioApiUnauthorized(
          "פג תוקף ההתחברות — התחברו מחדש דרך /login"
        );
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  } catch (error) {
    if (studioApi) {
      if (
        error instanceof Error &&
        error.message === "JWT_SECRET_MISSING"
      ) {
        return studioApiUnauthorized(
          "JWT_SECRET חסר ב-Vercel — הוסיפו משתנה סביבה לסביבת Production.",
          500
        );
      }
      return studioApiUnauthorized(
        "פג תוקף ההתחברות — התחברו מחדש דרך /login"
      );
    }

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/studio/:path*", "/api/studio/:path*", "/login"],
};
