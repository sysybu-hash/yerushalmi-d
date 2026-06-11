import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "admin_token";

async function verifyAdminToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
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

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    if (!(await verifyAdminToken(token))) {
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/studio/:path*", "/login"],
};
