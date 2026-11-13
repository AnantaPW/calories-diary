#!/usr/bin/env node
/*
 * Sets a new password for an account and logs it out everywhere.
 * There's no email, so this is how a forgotten password is fixed.
 * Run it on the machine that holds the data:
 *
 *   npm run reset-password -- <username>
 *
 * Uses the same DATA_DIR as the app (from the environment or .env.local)
 * and the same password hash format as src/lib/server/auth.ts.
 */
import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64 };
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

function dataDirFromEnv() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const envFile = path.resolve(".env.local");
  if (!existsSync(envFile)) return "data";
  const line = readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith("DATA_DIR="));
  const value = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
  return value || "data";
}

const DATA_DIR = path.resolve(dataDirFromEnv());

function fail(message) {
  console.error(message);
  process.exit(1);
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const { N, r, p, keylen } = SCRYPT;
  return new Promise((resolve, reject) =>
    scryptCallback(password, salt, keylen, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err
        ? reject(err)
        : resolve(["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$")),
    ),
  );
}

/*
 * One line reader for both questions. Lines are queued as they arrive, so
 * piped input (where both lines come at once) works as well as typing.
 * Typing isn't echoed when run in a terminal.
 */
const tty = Boolean(process.stdin.isTTY);
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: tty });
let muted = false;
rl._writeToOutput = (text) => {
  if (!muted) rl.output.write(text);
};
const lines = [];
const waiting = [];
let inputEnded = false;
rl.on("line", (line) => (waiting.length ? waiting.shift()(line) : lines.push(line)));
rl.on("close", () => {
  inputEnded = true;
  while (waiting.length) waiting.shift()(null);
});

function askHidden(question) {
  process.stdout.write(question);
  muted = tty;
  return new Promise((resolve) => {
    const done = (answer) => {
      muted = false;
      if (tty) process.stdout.write("\n");
      if (answer === null) fail("No input. Nothing was changed.");
      resolve(answer);
    };
    if (lines.length) done(lines.shift());
    else if (inputEnded) done(null);
    else waiting.push(done);
  });
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    fail(`Can't read ${file}. Fix or restore it before resetting a password.`);
  }
}

async function writeJsonAtomic(file, value) {
  const temp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}

const username = process.argv[2];
if (!username) fail("Usage: npm run reset-password -- <username>");

const usersFile = path.join(DATA_DIR, "users.json");
const users = await readJson(usersFile);
const user = users?.users?.find((u) => u.usernameKey === username.toLowerCase());
if (!user) fail(`No account called "${username}" in ${DATA_DIR}.`);

const password = await askHidden(`New password for ${user.username}: `);
if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
  rl.close();
  fail(`The password needs ${PASSWORD_MIN} to ${PASSWORD_MAX} characters. Nothing was changed.`);
}
const again = await askHidden("Type it again: ");
rl.close();
if (again !== password) fail("The two passwords don't match. Nothing was changed.");

const passwordHash = await hashPassword(password);
// Re-read just before writing, so a sign-up that happened meanwhile isn't lost.
const latest = await readJson(usersFile);
await writeJsonAtomic(usersFile, {
  ...latest,
  users: latest.users.map((u) =>
    u.id === user.id ? { ...u, passwordHash, passwordChangedAt: new Date().toISOString() } : u,
  ),
});

const sessionsFile = path.join(DATA_DIR, "sessions.json");
const sessions = await readJson(sessionsFile);
if (sessions?.sessions) {
  await writeJsonAtomic(sessionsFile, {
    ...sessions,
    sessions: sessions.sessions.filter((s) => s.userId !== user.id),
  });
}

console.log(`Password changed for ${user.username}. They are logged out everywhere.`);
