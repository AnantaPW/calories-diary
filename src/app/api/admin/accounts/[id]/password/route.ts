import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { deleteAllSessions, findUserById, setPassword } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/session";
import { passwordProblem } from "@/lib/userData";

/** Sets a new password for someone else's account and logs it out everywhere. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;
  const { id } = await params;

  if (id === guard.session.user.id) {
    return jsonError(400, "Change your own password in Profile.");
  }
  const user = await findUserById(id);
  if (!user) return jsonError(404, "That account no longer exists.");

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  const problem = passwordProblem(password, user.username);
  if (problem) return jsonError(400, problem, { field: "password" });

  await setPassword(user.id, password);
  await deleteAllSessions(user.id);
  return NextResponse.json({ ok: true });
}
