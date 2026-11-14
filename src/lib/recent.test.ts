// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { recentFoods } from "./recent.ts";
import type { FoodEntry } from "./types.ts";

const entry = (name: string, calories: number, createdAt: string): FoodEntry => ({
  id: createdAt,
  date: "2026-11-14",
  meal: "lunch",
  name,
  calories,
  createdAt,
});

test("newest first, one per name ignoring case, latest numbers win", () => {
  const foods = recentFoods([
    entry("Rice", 200, "2026-11-01T01:00:00Z"),
    entry("Egg", 70, "2026-11-02T01:00:00Z"),
    entry("rice ", 250, "2026-11-03T01:00:00Z"),
  ]);
  assert.deepEqual(
    foods.map((f) => [f.name, f.calories]),
    [["rice ", 250], ["Egg", 70]],
  );
});

test("stops at the limit", () => {
  const many = Array.from({ length: 12 }, (_, i) => entry(`Food ${i}`, i, `2026-11-${10 + i}T00:00:00Z`));
  assert.equal(recentFoods(many, 5).length, 5);
  assert.equal(recentFoods([]).length, 0);
});
