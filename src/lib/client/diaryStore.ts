"use client";

import { calculateDailyTarget, DEFAULT_PROFILE, recordTargetChange } from "@/lib/calories";
import { toDateKey } from "@/lib/date";
import type { Accent } from "@/lib/theme";
import type { FoodEntry, UserProfile } from "@/lib/types";
import type { MeResponse, UserData } from "@/lib/userData";
import { reloadTo } from "./navigate";
import { showToast } from "./uiStore";

/*
 * The signed-in person's diary in the browser. Loads once from /api/me, then
 * every change shows immediately and is saved to the server in the
 * background. If a save fails, the diary is reloaded from the server (the
 * source of truth) and a toast explains what happened.
 */

export type DiaryState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; username: string; data: UserData };

let state: DiaryState = { status: "loading" };
let started = false;
const listeners = new Set<() => void>();

const SERVER_STATE: DiaryState = { status: "loading" };

function emit() {
  listeners.forEach((l) => l());
}

function setState(next: DiaryState) {
  state = next;
  emit();
}

function goToLogin() {
  // Never reload the login page itself: that would loop.
  if (window.location.pathname !== "/login") reloadTo("/login");
}

async function load() {
  try {
    const response = await fetch("/api/me", { cache: "no-store" });
    if (response.status === 401) return goToLogin();
    if (!response.ok) return setState({ status: "error" });
    const me = (await response.json()) as MeResponse;
    setState({ status: "ready", username: me.username, data: me.data });
  } catch {
    setState({ status: "error" });
  }
}

export const diaryStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!started) {
      started = true;
      void load();
    }
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,
  reload: load,
};

/** Applies a change locally right away, then saves it; on failure, reloads from the server. */
async function mutate(
  apply: (data: UserData) => UserData,
  request: { url: string; method: string; body?: unknown },
) {
  if (state.status !== "ready") return;
  setState({ ...state, data: apply(state.data) });
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.body ? { "Content-Type": "application/json" } : undefined,
      body: request.body ? JSON.stringify(request.body) : undefined,
    });
    if (response.status === 401) return goToLogin();
    if (response.ok) return;
    const data = await response.json().catch(() => null);
    if (data?.error === "unreadable") return setState({ status: "error" });
    showToast(data?.error ? `Couldn't save: ${data.error}` : "Couldn't save. Try again.");
  } catch {
    showToast("Couldn't save. Check your connection and try again.");
  }
  await load();
}

export function addEntries(entries: FoodEntry[]) {
  if (entries.length === 0) return;
  return mutate(
    (data) => {
      const ids = new Set(data.entries.map((e) => e.id));
      const fresh = entries.filter((e) => !ids.has(e.id));
      return {
        ...data,
        entries: [...data.entries, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      };
    },
    { url: "/api/entries", method: "POST", body: { entries } },
  );
}

export function removeEntry(id: string) {
  return mutate((data) => ({ ...data, entries: data.entries.filter((e) => e.id !== id) }), {
    url: `/api/entries/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

export function saveProfile(profile: UserProfile) {
  const today = toDateKey();
  return mutate(
    (data) => ({
      ...data,
      profile,
      targets: recordTargetChange(
        data.targets,
        calculateDailyTarget(data.profile ?? DEFAULT_PROFILE),
        calculateDailyTarget(profile),
        today,
      ),
    }),
    { url: "/api/profile", method: "PUT", body: { profile, today } },
  );
}

export function saveAccent(accent: Accent) {
  return mutate((data) => ({ ...data, settings: { ...data.settings, accent } }), {
    url: "/api/settings",
    method: "PUT",
    body: { accent },
  });
}
