// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseEstimates } from "./estimate.ts";

test("reads COUNT plus one row per food, skipping headers and fences", () => {
  const reply = "```\nCOUNT: 2\nname, kcal, protein, carbs, fat\nNasi goreng, 650, 18, 80, 22.25\nIced tea, 90, 0, 23, 0\n```";
  assert.deepEqual(parseEstimates(reply), [
    { name: "Nasi goreng", calories: 650, protein: 18, carbs: 80, fat: 22.3 },
    { name: "Iced tea", calories: 90, protein: 0, carbs: 23, fat: 0 },
  ]);
});

test("COUNT: 0 means no food; junk means unreadable", () => {
  assert.deepEqual(parseEstimates("COUNT: 0"), []);
  assert.equal(parseEstimates("Sorry, I can't help with that."), null);
});

test("COUNT: 10 is not mistaken for zero", () => {
  assert.equal(parseEstimates("COUNT: 10\nEgg, 70, 6, 0, 5")?.length, 1);
});
