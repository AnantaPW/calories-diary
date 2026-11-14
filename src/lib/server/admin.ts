import "server-only";
import {
  computeStats,
  isAdminName,
  resolveSignup,
  summarizeDiary,
  type AccountRow,
  type AdminOverview,
  type AppFile,
  type SignupState,
} from "@/lib/admin";
import { toDateKey } from "@/lib/date";
import { listUsers, type UserRecord } from "./auth";
import { jsonError, requireSession, type Guarded } from "./session";
import { dataPath, readJson, updateJson } from "./store";
import { readUserData } from "./userStore";

export const isAdmin = (user: UserRecord) => isAdminName(user.username, process.env.ADMIN_USERNAMES);

/** For admin API routes: like requireSession, but a non-admin gets 404 so the routes don't advertise themselves. */
export async function requireAdmin(request: Request): Promise<Guarded> {
  const guard = await requireSession(request);
  if (!guard.ok) return guard;
  if (!isAdmin(guard.session.user)) return { ok: false, response: jsonError(404, "Not found") };
  return guard;
}

/** Every account with counts from its diary. Diary contents never leave this function. */
async function listAccounts(): Promise<AccountRow[]> {
  const today = toDateKey();
  // shortcut: reads every diary per request, fine for a household; cache or page past ~50 accounts.
  return Promise.all(
    (await listUsers()).map(async (user): Promise<AccountRow> => {
      const data = await readUserData(user.id);
      return {
        id: user.id,
        username: user.username,
        isAdmin: isAdmin(user),
        createdAt: user.createdAt,
        passwordChangedAt: user.passwordChangedAt,
        diary: data.status === "ok" ? summarizeDiary(data.value.entries, today) : null,
      };
    }),
  );
}

export async function adminOverview(): Promise<AdminOverview> {
  const [accounts, signup] = await Promise.all([listAccounts(), signupState()]);
  return { accounts, stats: computeStats(accounts, new Date()), signup };
}

// ---- Sign-up switch (data/app.json) ----------------------------------------

const APP_FILE = () => dataPath("app.json");

export async function signupState(): Promise<SignupState> {
  return resolveSignup(await readJson<AppFile>(APP_FILE()), process.env.ALLOW_SIGNUP);
}

export const signupAllowed = async () => (await signupState()).allowed;

/** Throws CorruptFileError rather than overwrite an unreadable app.json. */
export function saveSignupAllowed(allowed: boolean): Promise<void> {
  return updateJson<AppFile, void>(APP_FILE(), () => ({ version: 1 }), (file) => ({
    next: { ...file, version: 1, signupAllowed: allowed },
    result: undefined,
  }));
}
