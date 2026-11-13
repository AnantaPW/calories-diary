import { NextResponse } from "next/server";
import { checkCredentials, createSession, ipLoginLimiter, loginLimiter } from "@/lib/server/auth";
import { clientIp, jsonError, sameOrigin, setSessionCookie } from "@/lib/server/session";
import { PASSWORD_MAX, USERNAME_MAX } from "@/lib/userData";

/** Same message for an unknown username and a wrong password. */
const WRONG = "Username or password is incorrect.";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "Request blocked: it didn't come from this app.");

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return jsonError(400, "Enter your username and password.");
  if (username.length > USERNAME_MAX || password.length > 1024) return jsonError(401, WRONG);

  const userKey = `user:${username.toLowerCase()}`;
  const ipKey = `ip:${clientIp(request)}`;
  const wait = Math.max(loginLimiter.retryAfter(userKey), ipLoginLimiter.retryAfter(ipKey));
  if (wait > 0) {
    const minutes = Math.ceil(wait / 60000);
    return jsonError(
      429,
      `Too many failed attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
    );
  }

  const user =
    password.length > PASSWORD_MAX ? null : await checkCredentials(username, password);
  if (!user) {
    loginLimiter.record(userKey);
    ipLoginLimiter.record(ipKey);
    return jsonError(401, WRONG);
  }
  loginLimiter.clear(userKey);

  const { token, expiresAt } = await createSession(user.id);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, token, expiresAt);
  return response;
}
