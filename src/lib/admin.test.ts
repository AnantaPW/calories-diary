// Run with `npm test` (Node's own test runner, which strips the types).
import assert from "node:assert/strict";
import { test } from "node:test";
import { computeStats, isAdminName, resolveSignup, summarizeDiary, type AccountRow } from "./admin.ts";

test("admin names: listed, other case, spaces, unlisted, unset", () => {
  assert.equal(isAdminName("sam", "sam,alex"), true);
  assert.equal(isAdminName("Alex", " sam , ALEX "), true);
  assert.equal(isAdminName("kim", "sam,alex"), false);
  assert.equal(isAdminName("sam", undefined), false);
  assert.equal(isAdminName("sam", " , "), false);
});

test("diary summary: counts, last day, 7-day window edges", () => {
  const today = "2026-11-14";
  const s = summarizeDiary(
    [{ date: "2026-11-08" }, { date: "2026-11-07" }, { date: "2026-11-14" }, { date: "2026-10-01" }],
    today,
  );
  assert.deepEqual(s, { entryCount: 4, lastLogged: "2026-11-14", recentEntries: 2 });
  assert.deepEqual(summarizeDiary([], today), { entryCount: 0, lastLogged: null, recentEntries: 0 });
  // Window crosses a month start.
  assert.equal(summarizeDiary([{ date: "2026-02-23" }], "2026-03-01").recentEntries, 1);
  assert.equal(summarizeDiary([{ date: "2026-02-22" }], "2026-03-01").recentEntries, 0);
});

test("stats: 30-day cut-off, active people, unreadable files", () => {
  const now = new Date("2026-11-14T12:00:00Z");
  const row = (createdAt: string, diary: AccountRow["diary"]): AccountRow => ({
    id: createdAt, username: "u", isAdmin: false, createdAt, passwordChangedAt: createdAt, diary,
  });
  const stats = computeStats(
    [
      row("2026-10-15T12:00:00Z", { entryCount: 5, lastLogged: "2026-11-14", recentEntries: 3 }), // exactly 30 days
      row("2026-10-15T11:59:59Z", { entryCount: 1, lastLogged: "2026-11-01", recentEntries: 0 }),
      row("2026-11-13T00:00:00Z", null),
    ],
    now,
  );
  assert.deepEqual(stats, { accounts: 3, newAccounts30: 2, activePeople7: 1, entries7: 3, unreadable: 1 });
});

test("sign-up: no file, saved on, saved off, unreadable", () => {
  assert.deepEqual(resolveSignup({ status: "missing" }, undefined), { allowed: true, source: "environment", unreadable: false });
  assert.deepEqual(resolveSignup({ status: "missing" }, "false"), { allowed: false, source: "environment", unreadable: false });
  assert.deepEqual(resolveSignup({ status: "ok", value: { version: 1, signupAllowed: true } }, "false"), { allowed: true, source: "saved", unreadable: false });
  assert.deepEqual(resolveSignup({ status: "ok", value: { version: 1, signupAllowed: false } }, "true"), { allowed: false, source: "saved", unreadable: false });
  assert.deepEqual(resolveSignup({ status: "ok", value: { version: 1 } }, "false"), { allowed: false, source: "environment", unreadable: false });
  assert.deepEqual(resolveSignup({ status: "corrupt" }, "false"), { allowed: false, source: "environment", unreadable: true });
});
