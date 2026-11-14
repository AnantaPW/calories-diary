import "server-only";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";
import { readJson, updateJson, dataPath } from "./store";

/*
 * Accounts and sessions. Passwords are hashed with scrypt (built into Node)
 * and a random salt per account. Session tokens are random; only their
 * SHA-256 hash is stored, so reading sessions.json doesn't let anyone log in.
 */

export interface UserRecord {
  id: string;
  username: string;
  /** Lower-cased username, for case-insensitive uniqueness. */
  usernameKey: string;
  passwordHash: string;
  createdAt: string;
  passwordChangedAt: string;
}

interface UsersFile {
  version: 1;
  users: UserRecord[];
}

interface SessionRecord {
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface SessionsFile {
  version: 1;
  sessions: SessionRecord[];
}

const USERS_FILE = () => dataPath("users.json");
const SESSIONS_FILE = () => dataPath("sessions.json");

// ---- Password hashing ----------------------------------------------------

/** Stored as scrypt$N$r$p$salt$hash so the parameters can change later. */
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64 };
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) =>
    scryptCallback(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  const key = await scrypt(password, salt, keylen, { N, r, p, maxmem: SCRYPT_MAXMEM });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const key = await scrypt(password, Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT_MAXMEM,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Hashed once, used to spend the same time on logins for unknown usernames. */
let dummyHash: Promise<string> | null = null;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

// ---- Users ---------------------------------------------------------------

const emptyUsers = (): UsersFile => ({ version: 1, users: [] });

export async function listUsers(): Promise<UserRecord[]> {
  const file = await readJson<UsersFile>(USERS_FILE());
  if (file.status === "corrupt") throw new Error("users.json can't be read");
  return file.status === "ok" ? file.value.users : [];
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  return (await listUsers()).find((u) => u.id === id) ?? null;
}

export async function createUser(
  username: string,
  password: string,
): Promise<{ ok: true; user: UserRecord } | { ok: false; reason: "taken" }> {
  const passwordHash = await hashPassword(password);
  const usernameKey = username.toLowerCase();
  type Created = { ok: true; user: UserRecord } | { ok: false; reason: "taken" };
  return updateJson<UsersFile, Created>(USERS_FILE(), emptyUsers, (file) => {
    if (file.users.some((u) => u.usernameKey === usernameKey)) {
      return { next: file, result: { ok: false, reason: "taken" } };
    }
    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      username,
      usernameKey,
      passwordHash,
      createdAt: now,
      passwordChangedAt: now,
    };
    return { next: { ...file, users: [...file.users, user] }, result: { ok: true, user } };
  });
}

/** The user when username and password match, otherwise null (same timing either way). */
export async function checkCredentials(username: string, password: string): Promise<UserRecord | null> {
  const user = (await listUsers()).find((u) => u.usernameKey === username.toLowerCase());
  if (!user) {
    await verifyPassword(password, await getDummyHash());
    return null;
  }
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const passwordHash = await hashPassword(password);
  await updateJson(USERS_FILE(), emptyUsers, (file) => ({
    next: {
      ...file,
      users: file.users.map((u) =>
        u.id === userId ? { ...u, passwordHash, passwordChangedAt: new Date().toISOString() } : u,
      ),
    },
    result: undefined,
  }));
}

/** Removes an account's login. False when there was no such account. */
export async function deleteUser(userId: string): Promise<boolean> {
  return updateJson<UsersFile, boolean>(USERS_FILE(), emptyUsers, (file) => {
    const users = file.users.filter((u) => u.id !== userId);
    return { next: { ...file, users }, result: users.length !== file.users.length };
  });
}

// ---- Sessions ------------------------------------------------------------

export const SESSION_COOKIE = "cd_session";
const DAY = 24 * 60 * 60 * 1000;
export const SESSION_DAYS = 30;

const emptySessions = (): SessionsFile => ({ version: 1, sessions: [] });
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const live = (s: SessionRecord, now: number) => Date.parse(s.expiresAt) > now;

/** Creates a session and returns the raw token for the cookie. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_DAYS * DAY);
  await updateJson(SESSIONS_FILE(), emptySessions, (file) => ({
    next: {
      ...file,
      sessions: [
        // Expired sessions are dropped whenever the file is written.
        ...file.sessions.filter((s) => live(s, now)),
        { tokenHash: hashToken(token), userId, createdAt: new Date(now).toISOString(), expiresAt: expiresAt.toISOString() },
      ],
    },
    result: undefined,
  }));
  return { token, expiresAt };
}

export interface ActiveSession {
  user: UserRecord;
  tokenHash: string;
  expiresAt: Date;
}

/** The session for a cookie token, if it exists, hasn't expired and its user still exists. */
export async function readSession(token: string | undefined): Promise<ActiveSession | null> {
  if (!token || token.length > 100) return null;
  const file = await readJson<SessionsFile>(SESSIONS_FILE());
  if (file.status !== "ok") return null;
  const tokenHash = hashToken(token);
  const session = file.value.sessions.find((s) => s.tokenHash === tokenHash);
  if (!session || !live(session, Date.now())) return null;
  const user = await findUserById(session.userId);
  if (!user) return null;
  return { user, tokenHash, expiresAt: new Date(session.expiresAt) };
}

/**
 * Pushes the expiry back to 30 days from now, at most once a day, so an
 * active person stays logged in without a write on every request.
 * Returns the new expiry when it changed.
 */
export async function extendSession(session: ActiveSession): Promise<Date | null> {
  const now = Date.now();
  if (session.expiresAt.getTime() - now > (SESSION_DAYS - 1) * DAY) return null;
  const expiresAt = new Date(now + SESSION_DAYS * DAY);
  await updateJson(SESSIONS_FILE(), emptySessions, (file) => ({
    next: {
      ...file,
      sessions: file.sessions
        .filter((s) => live(s, now))
        .map((s) => (s.tokenHash === session.tokenHash ? { ...s, expiresAt: expiresAt.toISOString() } : s)),
    },
    result: undefined,
  }));
  return expiresAt;
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await updateJson(SESSIONS_FILE(), emptySessions, (file) => ({
    next: { ...file, sessions: file.sessions.filter((s) => s.tokenHash !== tokenHash) },
    result: undefined,
  }));
}

/** Ends every session of a user except `keepTokenHash` (used after a password change). */
export async function deleteOtherSessions(userId: string, keepTokenHash: string): Promise<void> {
  const now = Date.now();
  await updateJson(SESSIONS_FILE(), emptySessions, (file) => ({
    next: {
      ...file,
      sessions: file.sessions.filter(
        (s) => live(s, now) && (s.userId !== userId || s.tokenHash === keepTokenHash),
      ),
    },
    result: undefined,
  }));
}

/** Ends every session of a user (admin password reset and account delete). */
export const deleteAllSessions = (userId: string) => deleteOtherSessions(userId, "");

// ---- Rate limiting -------------------------------------------------------

/**
 * Counts failures per key in memory (a restart clears it). After `limit`
 * failures inside `windowMs`, the key is blocked until the window passes.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Milliseconds until the key may try again, or 0 when it isn't blocked. */
  retryAfter(key: string): number {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length === 0) this.hits.delete(key);
    else this.hits.set(key, recent);
    return recent.length >= this.limit ? recent[recent.length - this.limit] + this.windowMs - now : 0;
  }

  record(key: string): void {
    const list = this.hits.get(key) ?? [];
    list.push(Date.now());
    this.hits.set(key, list.slice(-this.limit * 2));
  }

  clear(key: string): void {
    this.hits.delete(key);
  }
}

/** 5 failed logins per username within 15 minutes. */
export const loginLimiter = new RateLimiter(5, 15 * 60 * 1000);
/**
 * 20 failed logins per address within 15 minutes. Higher than the per-name
 * limit because a household shares one address, and one person's typos
 * shouldn't lock everyone else out; it still stops guessing across many names.
 */
export const ipLoginLimiter = new RateLimiter(20, 15 * 60 * 1000);
/** 30 AI estimates per person per hour. */
export const estimateLimiter = new RateLimiter(30, 60 * 60 * 1000);
