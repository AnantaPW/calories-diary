// Run with `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_DRAFT, draftToProfile, stepProblems, type WelcomeDraft } from "./welcome.ts";

const full: WelcomeDraft = {
  goal: "lose",
  sex: "female",
  age: "34",
  heightCm: "170",
  weightKg: "72.5",
  activity: "moderate",
  customTarget: "",
};

test("each step blocks until its own answers are in", () => {
  assert.deepEqual(Object.keys(stepProblems(1, EMPTY_DRAFT)), ["goal"]);
  assert.deepEqual(Object.keys(stepProblems(2, EMPTY_DRAFT)), ["sex", "age", "heightCm", "weightKg"]);
  assert.deepEqual(Object.keys(stepProblems(3, EMPTY_DRAFT)), ["activity"]);
  assert.deepEqual(stepProblems(4, EMPTY_DRAFT), {}, "custom target is optional");
  for (const step of [1, 2, 3, 4]) assert.deepEqual(stepProblems(step, full), {});
});

test("number limits match the server", () => {
  assert.ok(stepProblems(2, { ...full, age: "12" }).age);
  assert.ok(stepProblems(2, { ...full, heightCm: "251" }).heightCm);
  assert.ok(stepProblems(2, { ...full, weightKg: "abc" }).weightKg);
  assert.equal(stepProblems(2, { ...full, age: "13", heightCm: "250", weightKg: "30" }).age, undefined);
  assert.ok(stepProblems(4, { ...full, customTarget: "0" }).customTarget);
});

test("profile is built only from a complete draft", () => {
  assert.equal(draftToProfile(EMPTY_DRAFT), null);
  assert.equal(draftToProfile({ ...full, activity: null }), null);
  assert.deepEqual(draftToProfile(full), {
    goal: "lose", sex: "female", age: 34, heightCm: 170, weightKg: 72.5, activity: "moderate",
  });
  assert.equal(draftToProfile({ ...full, customTarget: "1900" })?.customTarget, 1900);
});
