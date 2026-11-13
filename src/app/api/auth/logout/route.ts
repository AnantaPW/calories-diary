import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/auth";
import { clearSessionCookie, getSession, jsonError, sameOrigin } from "@/lib/server/session";

/** Ends the session on the server, not just in the browser. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "Request blocked: it didn't come from this app.");
  const session = await getSession();
  if (session) await deleteSession(session.tokenHash);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
