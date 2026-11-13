import { NextResponse } from "next/server";
import { deleteOtherSessions, loginLimiter, setPassword, verifyPassword } from "@/lib/server/auth";
import { jsonError, requireSession } from "@/lib/server/session";
import { PASSWORD_MAX, passwordProblem } from "@/lib/userData";

export async function POST(request: Request) {
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;
  const { user, tokenHash } = guard.session;

  const key = `password:${user.id}`;
  const wait = loginLimiter.retryAfter(key);
  if (wait > 0) {
    return jsonError(
      429,
      `Too many wrong attempts. Try again in ${Math.ceil(wait / 60000)} minutes.`,
    );
  }

  const body = await request.json().catch(() => null);
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";

  const currentOk =
    current.length > 0 &&
    current.length <= PASSWORD_MAX &&
    (await verifyPassword(current, user.passwordHash));
  if (!currentOk) {
    loginLimiter.record(key);
    return jsonError(400, "Your current password is incorrect.", { field: "current" });
  }
  const problem = passwordProblem(next, user.username);
  if (problem) return jsonError(400, problem, { field: "next" });
  if (next === current) {
    return jsonError(400, "The new password is the same as the current one.", { field: "next" });
  }

  loginLimiter.clear(key);
  await setPassword(user.id, next);
  // Anyone logged in elsewhere with the old password is logged out.
  await deleteOtherSessions(user.id, tokenHash);
  return NextResponse.json({ ok: true });
}
