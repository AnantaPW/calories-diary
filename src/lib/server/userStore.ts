import "server-only";
import { DEFAULT_MODE, DEFAULT_THEME, isMode } from "@/lib/theme";
import type { UserData } from "@/lib/userData";
import { dataPath, readJson, updateJson, type ReadResult } from "./store";

/*
 * One JSON file per person: data/users/<user-id>.json. The id always comes
 * from the server-side session, never from the request.
 */

const ID_PATTERN = /^[0-9a-f-]{36}$/;

function userFile(userId: string) {
  if (!ID_PATTERN.test(userId)) throw new Error("Bad user id");
  return dataPath("users", `${userId}.json`);
}

export const emptyUserData = (): UserData => ({
  version: 1,
  profile: null,
  targets: [],
  entries: [],
  settings: { ...DEFAULT_THEME },
});

/** Fills in anything an older or hand-edited file is missing. */
function normalise(data: Partial<UserData>): UserData {
  const base = emptyUserData();
  return {
    version: 1,
    profile: data.profile ?? null,
    targets: Array.isArray(data.targets) ? data.targets : base.targets,
    entries: Array.isArray(data.entries) ? data.entries : base.entries,
    settings: normaliseSettings({ ...base.settings, ...(data.settings ?? {}) }),
  };
}

/** The mode lands in an attribute on every page, so a hand-edited value falls back to the default. */
function normaliseSettings(settings: UserData["settings"]): UserData["settings"] {
  return isMode(settings.mode) ? settings : { ...settings, mode: DEFAULT_MODE };
}

export async function readUserData(userId: string): Promise<ReadResult<UserData>> {
  const result = await readJson<Partial<UserData>>(userFile(userId));
  if (result.status === "missing") return { status: "ok", value: emptyUserData() };
  if (result.status === "corrupt") return result;
  return { status: "ok", value: normalise(result.value) };
}

/** Changes one person's file; throws CorruptFileError rather than overwrite an unreadable file. */
export function updateUserData<R>(
  userId: string,
  change: (current: UserData) => { next: UserData; result: R },
): Promise<R> {
  return updateJson<UserData, R>(userFile(userId), emptyUserData, (current) =>
    change(normalise(current)),
  );
}
