import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import { isAccent } from "@/lib/theme";

export async function PUT(request: Request) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const accent: unknown = body?.accent;
  if (!isAccent(accent)) return jsonError(400, "Unknown theme colour.");
  return changeUserData(request, (data) => ({
    ...data,
    settings: { ...data.settings, accent },
  }));
}
