import "server-only";
import { NextResponse } from "next/server";
import type { UserData } from "@/lib/userData";
import { jsonError, requireSession } from "./session";
import { CorruptFileError } from "./store";
import { updateUserData } from "./userStore";

/**
 * Shared shape of every route that changes the signed-in person's file:
 * check the session, apply the change, and turn an unreadable file into the
 * "unreadable" error instead of overwriting it.
 * `change` returns the next data, or an error message to send back as 400.
 */
export async function changeUserData(
  request: Request,
  change: (data: UserData) => UserData | { error: string },
  respond: () => NextResponse = () => NextResponse.json({ ok: true }),
): Promise<NextResponse> {
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;
  try {
    const error = await updateUserData(guard.session.user.id, (data) => {
      const next = change(data);
      return "error" in next ? { next: data, result: next.error } : { next, result: null };
    });
    return error ? jsonError(400, error) : respond();
  } catch (err) {
    if (err instanceof CorruptFileError) return jsonError(500, "unreadable");
    throw err;
  }
}
