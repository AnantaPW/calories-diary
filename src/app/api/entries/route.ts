import { changeUserData } from "@/lib/server/guardedWrite";
import { jsonError, requireSession } from "@/lib/server/session";
import type { FoodEntry } from "@/lib/types";
import { MAX_ENTRIES_PER_DAY, MAX_ENTRIES_TOTAL, parseEntry } from "@/lib/validate";

/** Adds one or more entries (AI input can add several at once). Also used by Undo. */
export async function POST(request: Request) {
  // Session and same-site check come before reading anything from the request.
  const guard = await requireSession(request);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.entries) ? body.entries : [];
  if (raw.length === 0 || raw.length > 20) return jsonError(400, "Send between 1 and 20 entries.");
  const incoming = raw.map(parseEntry);
  if (incoming.some((e) => e === null)) return jsonError(400, "One of the entries isn't valid.");

  return changeUserData(request, (data) => {
    const ids = new Set(data.entries.map((e) => e.id));
    // An entry that is already there (e.g. a repeated Undo) is skipped.
    const fresh = (incoming as FoodEntry[]).filter((e) => !ids.has(e.id));
    const onDay = (date: string) =>
      data.entries.filter((e) => e.date === date).length +
      fresh.filter((e) => e.date === date).length;
    if (fresh.some((e) => onDay(e.date) > MAX_ENTRIES_PER_DAY)) {
      return { error: `A day can hold at most ${MAX_ENTRIES_PER_DAY} entries.` };
    }
    if (data.entries.length + fresh.length > MAX_ENTRIES_TOTAL) {
      return { error: "The diary is full." };
    }
    const entries = [...data.entries, ...fresh].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    return { ...data, entries };
  });
}
