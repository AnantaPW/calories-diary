"use client";

import type { MealType } from "@/lib/types";

/*
 * App-wide UI state shared by components that aren't related in the tree:
 * the Add food sheet (opened from the "+" in the nav, Today, Diary or
 * History), the one toast, and which foods were just added (briefly
 * highlighted in the lists).
 */

export interface ToastMessage {
  /** Changes with every new message so the timer restarts. */
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

export interface LogRequest {
  /** Bumped on every open so the form starts fresh. */
  id: number;
  meal?: MealType;
  /** The day to add to; defaults to the day the Diary is showing, else today. */
  date?: string;
}

interface UiState {
  log: LogRequest | null;
  /** Day the Diary is showing, so "+" adds to it. */
  diaryDate: string | null;
  toast: ToastMessage | null;
  recent: string[];
}

let state: UiState = { log: null, diaryDate: null, toast: null, recent: [] };
const listeners = new Set<() => void>();
const SERVER_STATE: UiState = state;

function set(patch: Partial<UiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const uiStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  getServerSnapshot: () => SERVER_STATE,
};

export function openLog(request: Omit<LogRequest, "id"> = {}) {
  set({ log: { ...request, id: Date.now() } });
}

export function closeLog() {
  set({ log: null });
}

export function setDiaryDate(date: string | null) {
  if (state.diaryDate !== date) set({ diaryDate: date });
}

export function showToast(text: string, action?: ToastMessage["action"]) {
  set({ toast: { id: Date.now(), text, action } });
}

export function dismissToast() {
  set({ toast: null });
}

const HIGHLIGHT_MS = 2000;

/** Marks foods as just added so their rows briefly highlight. */
export function markRecent(ids: string[]) {
  if (ids.length === 0) return;
  set({ recent: [...state.recent, ...ids] });
  window.setTimeout(() => {
    set({ recent: state.recent.filter((id) => !ids.includes(id)) });
  }, HIGHLIGHT_MS);
}
