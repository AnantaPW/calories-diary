import { NextResponse } from "next/server";
import { requireAdmin, saveSignupAllowed, signupState } from "@/lib/server/admin";
import { jsonError } from "@/lib/server/session";
import { CorruptFileError } from "@/lib/server/store";

/** Turns Create account on or off. Saved in data/app.json, so it lasts across restarts. */
export async function PUT(request: Request) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  if (typeof body?.allowed !== "boolean") return jsonError(400, "Send allowed: true or false.");

  try {
    await saveSignupAllowed(body.allowed);
  } catch (err) {
    if (err instanceof CorruptFileError) {
      return jsonError(500, "data/app.json can't be read, so it wasn't changed. Fix or remove that file.");
    }
    throw err;
  }
  return NextResponse.json(await signupState());
}
