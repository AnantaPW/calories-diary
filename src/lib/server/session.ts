import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSession, SESSION_COOKIE, type ActiveSession } from "./auth";

/*
 * The data access layer's gatekeeper: every API route and server render that
 * touches someone's data gets the user from here, never from the request body.
 */

/** The signed-in session for the current request, or null. */
export async function getSession(): Promise<ActiveSession | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export const jsonError = (status: number, error: string, extra?: Record<string, unknown>) =>
  NextResponse.json({ error, ...extra }, { status });

/**
 * Rejects requests that change data unless they come from this app's own
 * pages (the browser always sends Origin on these requests).
 */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type Guarded =
  | { ok: true; session: ActiveSession }
  | { ok: false; response: NextResponse };

/** For API routes: the session, or the 403/401 response to return instead. */
export async function requireSession(request: Request): Promise<Guarded> {
  if (request.method !== "GET" && !sameOrigin(request)) {
    return { ok: false, response: jsonError(403, "Request blocked: it didn't come from this app.") };
  }
  const session = await getSession();
  if (!session) return { ok: false, response: jsonError(401, "Please log in again.") };
  return { ok: true, session };
}

export function setSessionCookie(response: NextResponse, token: string, expires: Date) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Best guess at the client's address, for rate limiting only. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

/** Sign-up is on unless ALLOW_SIGNUP=false. */
export const signupAllowed = () => process.env.ALLOW_SIGNUP !== "false";
