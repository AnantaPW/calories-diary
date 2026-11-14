/*
 * Admin rules with no server or browser imports, so the API, the page and
 * the tests share them. Admins are named in ADMIN_USERNAMES; the admin page
 * only ever sees counts from a diary, never its contents.
 */

/** Lower-cased usernames from a comma separated ADMIN_USERNAMES value. */
export function adminNames(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const isAdminName = (username: string, raw: string | undefined) =>
  adminNames(raw).has(username.toLowerCase());

// ---- Diary summaries and statistics ----------------------------------------

/** The only facts about a diary that leave the server. */
export interface DiarySummary {
  entryCount: number;
  /** Latest day with food logged (YYYY-MM-DD), or null. */
  lastLogged: string | null;
  /** Entries dated in the last 7 days, today included. */
  recentEntries: number;
}

export interface AccountRow {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  passwordChangedAt: string;
  /** null when the diary file exists but can't be read. */
  diary: DiarySummary | null;
}

export interface AdminStats {
  accounts: number;
  newAccounts30: number;
  activePeople7: number;
  entries7: number;
  unreadable: number;
}

export interface SignupState {
  allowed: boolean;
  /** "saved": an admin chose it on the admin page; "environment": ALLOW_SIGNUP decides. */
  source: "saved" | "environment";
  /** data/app.json exists but can't be read, so the environment decides. */
  unreadable: boolean;
}

export interface AdminOverview {
  accounts: AccountRow[];
  stats: AdminStats;
  signup: SignupState;
}

const DAY = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD `days` before `key`, in calendar days (same idea as lib/date's shiftDateKey). */
function daysBefore(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `today` is the server's local date key, as the rest of the app uses. */
export function summarizeDiary(entries: { date: string }[], today: string): DiarySummary {
  const from = daysBefore(today, 6);
  let lastLogged: string | null = null;
  let recentEntries = 0;
  for (const { date } of entries) {
    if (!lastLogged || date > lastLogged) lastLogged = date;
    if (date >= from && date <= today) recentEntries++;
  }
  return { entryCount: entries.length, lastLogged, recentEntries };
}

export function computeStats(accounts: AccountRow[], now: Date): AdminStats {
  const since = now.getTime() - 30 * DAY;
  return {
    accounts: accounts.length,
    newAccounts30: accounts.filter((a) => Date.parse(a.createdAt) >= since).length,
    activePeople7: accounts.filter((a) => (a.diary?.recentEntries ?? 0) > 0).length,
    entries7: accounts.reduce((sum, a) => sum + (a.diary?.recentEntries ?? 0), 0),
    unreadable: accounts.filter((a) => a.diary === null).length,
  };
}

// ---- Sign-up switch ---------------------------------------------------------

/** What data/app.json holds. */
export interface AppFile {
  version: 1;
  signupAllowed?: boolean;
}

/** The saved choice wins; without one (or with an unreadable file) ALLOW_SIGNUP decides, on unless "false". */
export function resolveSignup(
  file: { status: "ok"; value: AppFile } | { status: "missing" } | { status: "corrupt" },
  allowSignupEnv: string | undefined,
): SignupState {
  if (file.status === "ok" && typeof file.value.signupAllowed === "boolean") {
    return { allowed: file.value.signupAllowed, source: "saved", unreadable: false };
  }
  return { allowed: allowSignupEnv !== "false", source: "environment", unreadable: file.status === "corrupt" };
}
