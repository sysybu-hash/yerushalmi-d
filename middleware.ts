import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "admin_token";

/**
 * שומר הסף של אזורי הניהול: /workspace ו־/studio
 * נגישים רק עם JWT תקף בעוגייה. רץ ב־Edge Runtime (לכן jose).
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const loginUrl = new URL("/login", request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "admin") {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    // טוקן פג תוקף, מזויף או שנחתם בסוד אחר
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ["/workspace/:path*", "/studio/:path*"],
};
