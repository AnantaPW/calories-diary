#!/usr/bin/env node
/*
 * Creates (or refreshes) a test account with ~two months of diary history.
 *
 *   node scripts/seed-demo.mjs
 *
 * Log in as   demo / demo-diary-2026
 * Re-running keeps the account and replaces its diary with fresh data.
 * Writes straight into DATA_DIR (default ./data), same formats as the app.
 */
import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const USERNAME = "demo";
const PASSWORD = "demo-diary-2026";
const DAYS = 60;

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, keylen: 64 };

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

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return fallback;
    throw new Error(`Can't read ${file}; fix it before seeding.`);
  }
}

async function writeJsonAtomic(file, value) {
  const temp = `${file}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
}

// Local YYYY-MM-DD, like src/lib/date.ts.
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Seeded so every run gives the same diary.
let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = (list) => list[Math.floor(rand() * list.length)];

// [name, kcal, protein, carbs, fat]
const FOODS = {
  breakfast: [
    ["Oatmeal with banana", 320, 9, 58, 6],
    ["Two scrambled eggs on toast", 380, 20, 30, 19],
    ["Greek yogurt with granola", 290, 17, 38, 8],
    ["Nasi uduk", 450, 10, 62, 17],
    ["Avocado toast", 340, 9, 32, 20],
    ["Bubur ayam", 370, 16, 55, 9],
  ],
  lunch: [
    ["Chicken rice bowl", 620, 38, 72, 16],
    ["Nasi goreng", 680, 20, 85, 26],
    ["Tuna salad sandwich", 480, 28, 45, 20],
    ["Gado-gado", 520, 18, 40, 32],
    ["Beef burrito", 710, 35, 78, 27],
    ["Mie ayam", 560, 24, 70, 18],
  ],
  dinner: [
    ["Grilled salmon with rice", 640, 40, 55, 26],
    ["Chicken satay with lontong", 590, 36, 52, 24],
    ["Spaghetti bolognese", 720, 32, 88, 24],
    ["Tofu and vegetable stir-fry", 430, 22, 40, 20],
    ["Soto ayam", 410, 28, 35, 15],
    ["Pepperoni pizza, 3 slices", 860, 34, 96, 36],
  ],
  snack: [
    ["Apple", 95, 0, 25, 0],
    ["Iced coffee with milk", 150, 5, 20, 5],
    ["Handful of almonds", 170, 6, 6, 15],
    ["Chocolate bar", 230, 3, 26, 13],
    ["Pisang goreng", 210, 2, 32, 9],
    ["Protein shake", 160, 25, 6, 3],
  ],
};
const HOURS = { breakfast: 7, lunch: 12, dinner: 19, snack: 15 };

function entriesFor(day) {
  const date = dateKey(day);
  const meals = ["breakfast", "lunch", "dinner"].filter(() => rand() > 0.1);
  for (let n = Math.floor(rand() * 3); n > 0; n--) meals.push("snack");
  return meals.map((meal) => {
    const [name, kcal, protein, carbs, fat] = pick(FOODS[meal]);
    const created = new Date(day);
    created.setHours(HOURS[meal], Math.floor(rand() * 60));
    return {
      id: randomUUID(),
      date,
      meal,
      name,
      calories: kcal,
      protein,
      carbs,
      fat,
      createdAt: created.toISOString(),
    };
  });
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const entries = [];
for (let i = DAYS - 1; i >= 0; i--) {
  const day = new Date(today);
  day.setDate(today.getDate() - i);
  if (i > 0 && rand() < 0.08) continue; // the odd forgotten day
  entries.push(...entriesFor(day));
}

const start = new Date(today);
start.setDate(today.getDate() - (DAYS - 1));
const switchDay = new Date(today);
switchDay.setDate(today.getDate() - 30);

const usersFile = path.join(DATA_DIR, "users.json");
const users = await readJson(usersFile, { version: 1, users: [] });
let user = users.users.find((u) => u.usernameKey === USERNAME);
if (!user) {
  const now = start.toISOString();
  user = {
    id: randomUUID(),
    username: USERNAME,
    usernameKey: USERNAME,
    passwordHash: await hashPassword(PASSWORD),
    createdAt: now,
    passwordChangedAt: now,
  };
  await mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
  await writeJsonAtomic(usersFile, { ...users, users: [...users.users, user] });
}

const usersDir = path.join(DATA_DIR, "users");
await mkdir(usersDir, { recursive: true, mode: 0o700 });
await writeJsonAtomic(path.join(usersDir, `${user.id}.json`), {
  version: 1,
  profile: {
    sex: "male",
    age: 29,
    heightCm: 175,
    weightKg: 78,
    activity: "moderate",
    goal: "lose",
    customTarget: 2100,
  },
  // Target dropped a month ago, so the history shows a change.
  targets: [
    { from: "", target: 2400 },
    { from: dateKey(switchDay), target: 2100 },
  ],
  entries,
  settings: (await readJson(path.join(usersDir, `${user.id}.json`), {})).settings ?? {},
});

const days = new Set(entries.map((e) => e.date)).size;
console.log(`Seeded "${USERNAME}": ${entries.length} entries over ${days} days (${dateKey(start)} to ${dateKey(today)}).`);
