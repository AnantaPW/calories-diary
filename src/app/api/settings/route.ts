import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import { isAccent, isMode } from "@/lib/theme";

/** Saves the theme: the colour, the mode, or both. Fields left out keep their saved value. */
export async function PUT(request: Request) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const accent: unknown = body?.accent;
  const mode: unknown = body?.mode;
  if (accent === undefined && mode === undefined) return jsonError(400, "Nothing to save.");
  if (accent !== undefined && !isAccent(accent)) return jsonError(400, "Unknown theme colour.");
  if (mode !== undefined && !isMode(mode)) return jsonError(400, "Unknown mode.");
  return changeUserData(request, (data) => ({
    ...data,
    settings: {
      ...data.settings,
      ...(accent !== undefined && { accent }),
      ...(mode !== undefined && { mode }),
    },
  }));
}
