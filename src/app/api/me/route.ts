import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { extendSession, SESSION_COOKIE } from "@/lib/server/auth";
import { jsonError, requireSession, setSessionCookie } from "@/lib/server/session";
import { readUserData } from "@/lib/server/userStore";
import type { MeResponse } from "@/lib/userData";

/** The signed-in person and their whole diary. */
export async function GET(request: Request) {
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;
  const { session } = guard;

  const data = await readUserData(session.user.id);
  if (data.status !== "ok") return jsonError(500, "unreadable");

  const body: MeResponse = { username: session.user.username, data: data.value };
  const response = NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });

  // Keep active people logged in: push the expiry back (at most once a day).
  const extended = await extendSession(session);
  if (extended) {
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    if (token) setSessionCookie(response, token, extended);
  }
  return response;
}
