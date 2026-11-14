import { NextResponse, type NextRequest } from "next/server";

/*
 * First, fast check only: pages need a session cookie, otherwise go to the
 * login page. Whether the cookie is real is checked on the server by every
 * API route (lib/server/session.ts), which is where the data is protected.
 */
const SESSION_COOKIE = "cd_session";
const PUBLIC_PAGES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasCookie && !PUBLIC_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // API routes answer 401 themselves; static files need no check.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo/|images/).*)"],
};
