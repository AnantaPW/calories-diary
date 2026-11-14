import { NextResponse } from "next/server";
import { adminOverview, requireAdmin } from "@/lib/server/admin";
import { jsonError } from "@/lib/server/session";

/** Statistics, accounts (counts only) and the sign-up switch, for the admin page. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;
  try {
    return NextResponse.json(await adminOverview(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError(500, "The account list couldn't be read from the data folder.");
  }
}
