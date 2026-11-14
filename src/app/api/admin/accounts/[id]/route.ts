import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { deleteAllSessions, deleteUser, findUserById } from "@/lib/server/auth";
import { jsonError } from "@/lib/server/session";
import { deleteUserData } from "@/lib/server/userStore";

/** Deletes an account: login first (so it can't act any more), then sessions, then the diary file. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;
  const { id } = await params;

  if (id === guard.session.user.id) return jsonError(400, "You can't delete your own account here.");
  const user = await findUserById(id);
  if (!user) return jsonError(404, "That account no longer exists.");

  const body = await request.json().catch(() => null);
  if (body?.confirm !== user.username) {
    return jsonError(400, `Type ${user.username} exactly to confirm.`, { field: "confirm" });
  }

  if (!(await deleteUser(user.id))) return jsonError(404, "That account no longer exists.");
  try {
    await deleteAllSessions(user.id);
    await deleteUserData(user.id);
  } catch {
    return jsonError(
      500,
      `${user.username} can no longer log in, but their sessions or diary file couldn't be removed. Check the data folder.`,
    );
  }
  return NextResponse.json({ ok: true });
}
