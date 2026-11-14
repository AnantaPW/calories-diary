// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayPart, greetName } from "./greeting.ts";

const at = (h: number, m = 0) => dayPart(new Date(2026, 10, 14, h, m));

test("greeting and meal follow the hour windows", () => {
  assert.deepEqual([at(4, 59).greeting, at(5).greeting], ["Late one", "Morning"]);
  assert.deepEqual([at(10, 59).meal, at(11).meal], ["breakfast", "lunch"]);
  assert.deepEqual([at(15, 59).meal, at(16).meal], ["lunch", "dinner"]);
  assert.deepEqual([at(21, 59).greeting, at(22).greeting], ["Evening", "Late one"]);
  assert.equal(at(23).meal, null);
});

test("the sun crosses the arc by day and the moon by night", () => {
  assert.equal(at(5).t, 0);
  assert.equal(at(13, 30).t, 0.5);
  assert.equal(at(22).night, true);
  assert.equal(at(22).t, 0);
  assert.equal(at(1, 30).t, 0.5);
  assert.ok(at(4, 59).t < 1 && at(21, 59).t < 1);
});

test("greetName trims email-style usernames and handles none", () => {
  assert.equal(greetName("ana@mail.com"), "ana");
  assert.equal(greetName("Ana"), "Ana");
  assert.equal(greetName(null), null);
  assert.equal(greetName("@x"), null);
});
