"use client";

import { toast } from "@/components/ui/toast";
import type { ReactNode } from "react";
import type { MealType } from "@/lib/types";

/*
 * App-wide UI state shared by components that aren't related in the tree:
 * the Add food sheet (opened from the "+" in the nav, Today, Diary or
 * History) and which foods were just added (briefly
 * highlighted in the lists).
 */

export interface ToastAction {
  label: string;
  run: () => void;
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
  recent: string[];
  /** Meal pointed at or focused in the meals card; its arc lights up on the plate. */
  litMeal: MealType | null;
}

let state: UiState = { log: null, diaryDate: null, recent: [], litMeal: null };
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

/** The app's one toast (the Toaster keeps a limit of one): "Added…", "Removed… Undo", save errors. */
export function showToast(text: string, action?: ToastAction, icon?: ReactNode) {
  const id: string = toast.add({
    title: text,
    data: icon ? { icon } : undefined,
    actionProps: action && {
      children: action.label,
      onClick: () => {
        action.run();
        toast.close(id);
      },
    },
  });
}

export function setLitMeal(meal: MealType | null) {
  if (state.litMeal !== meal) set({ litMeal: meal });
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
