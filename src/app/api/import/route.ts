import { NextResponse } from "next/server";
import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import type { FoodEntry } from "@/lib/types";
import { MAX_ENTRIES_TOTAL, parseEntry, parseProfile, parseTargets } from "@/lib/validate";

/**
 * One-time import of a diary saved in the browser before accounts existed.
 * Entries already in the account are skipped. The profile and target history
 * are only taken when the account has no saved profile yet.
 */
export async function POST(request: Request) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.entries) ? body.entries : [];
  if (raw.length > MAX_ENTRIES_TOTAL) return jsonError(400, "Too many entries to import.");
  const valid = raw.map(parseEntry).filter((e): e is FoodEntry => e !== null);
  const profile = body?.profile ? parseProfile(body.profile) : null;
  const targets = body?.targets ? parseTargets(body.targets) : null;

  let added = 0;
  return changeUserData(
    request,
    (data) => {
      const ids = new Set(data.entries.map((e) => e.id));
      const fresh = valid
        .filter((e) => !ids.has(e.id))
        .slice(0, MAX_ENTRIES_TOTAL - data.entries.length);
      added = fresh.length;
      const takeProfile = data.profile === null && profile !== null;
      return {
        ...data,
        entries: [...data.entries, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
        profile: takeProfile ? profile : data.profile,
        targets: takeProfile && targets ? targets : data.targets,
      };
    },
    () => NextResponse.json({ added, skipped: raw.length - added }),
  );
}
