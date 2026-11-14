import { NextResponse } from "next/server";
import { createSession, createUser, RateLimiter } from "@/lib/server/auth";
import {
  clientIp,
  jsonError,
  sameOrigin,
  setSessionCookie,
} from "@/lib/server/session";
import { signupAllowed } from "@/lib/server/admin";
import { passwordProblem, usernameProblem } from "@/lib/userData";

/** 10 new accounts per address per hour. */
const signupLimiter = new RateLimiter(10, 60 * 60 * 1000);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return jsonError(403, "Request blocked: it didn't come from this app.");
  if (!(await signupAllowed())) return jsonError(403, "Sign-up is closed.");

  const ip = clientIp(request);
  const wait = signupLimiter.retryAfter(ip);
  if (wait > 0) {
    return jsonError(
      429,
      `Too many new accounts from here. Try again in ${Math.ceil(wait / 60000)} minutes.`,
    );
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const usernameError = usernameProblem(username);
  if (usernameError) return jsonError(400, usernameError, { field: "username" });
  const passwordError = passwordProblem(password, username);
  if (passwordError) return jsonError(400, passwordError, { field: "password" });

  const created = await createUser(username, password);
  if (!created.ok) {
    return jsonError(409, "That username is taken. Try another.", { field: "username" });
  }
  signupLimiter.record(ip);

  const { token, expiresAt } = await createSession(created.user.id);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, token, expiresAt);
  return response;
}
