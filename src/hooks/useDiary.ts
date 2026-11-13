"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { calculateDailyTarget, DEFAULT_PROFILE, targetForDate } from "@/lib/calories";
import {
  addEntries as storeAddEntries,
  diaryStore,
  removeEntry as storeRemoveEntry,
  saveAccent,
  saveProfile,
} from "@/lib/client/diaryStore";
import { newId } from "@/lib/storage";
import { DEFAULT_ACCENT } from "@/lib/theme";
import type { FoodEntry, TargetChange } from "@/lib/types";

export { DEFAULT_PROFILE };

const NO_ENTRIES: FoodEntry[] = [];
const NO_TARGETS: TargetChange[] = [];

function useDiaryState() {
  return useSyncExternalStore(
    diaryStore.subscribe,
    diaryStore.getSnapshot,
    diaryStore.getServerSnapshot,
  );
}

/**
 * Food entries for all days, saved on the server.
 * `loaded` is false until the diary has arrived; `error` is true when the
 * person's data file couldn't be read (or the server couldn't be reached).
 */
export function useEntries() {
  const state = useDiaryState();
  const entries = state.status === "ready" ? state.data.entries : NO_ENTRIES;

  /** Saves new foods and returns their ids (used to highlight them). */
  const addEntries = useCallback((list: Omit<FoodEntry, "id" | "createdAt">[]) => {
    const now = new Date().toISOString();
    const withIds = list.map((e) => ({ ...e, id: newId(), createdAt: now }));
    void storeAddEntries(withIds);
    return withIds.map((e) => e.id);
  }, []);

  const addEntry = useCallback(
    (entry: Omit<FoodEntry, "id" | "createdAt">) => addEntries([entry]),
    [addEntries],
  );

  const removeEntry = useCallback((id: string) => storeRemoveEntry(id), []);

  /** Puts a removed entry back with the same id (used by Undo). */
  const restoreEntry = useCallback((entry: FoodEntry) => storeAddEntries([entry]), []);

  const entriesForDate = useCallback(
    (date: string) => entries.filter((e) => e.date === date),
    [entries],
  );

  return {
    entries,
    loaded: state.status !== "loading",
    error: state.status === "error",
    addEntry,
    addEntries,
    removeEntry,
    restoreEntry,
    entriesForDate,
  };
}

/** The person's body profile and goal, saved on the server. */
export function useProfile() {
  const state = useDiaryState();
  const profile = (state.status === "ready" && state.data.profile) || DEFAULT_PROFILE;
  const history = state.status === "ready" ? state.data.targets : NO_TARGETS;

  /** The daily target that applied on a given day. */
  const targetFor = useCallback(
    (date: string) => targetForDate(history, date, calculateDailyTarget(profile)),
    [history, profile],
  );

  return useMemo(
    () => ({
      profile,
      setProfile: saveProfile,
      loaded: state.status !== "loading",
      error: state.status === "error",
      targetFor,
    }),
    [profile, state.status, targetFor],
  );
}

/** Who is signed in and their theme colour. */
export function useAccount() {
  const state = useDiaryState();
  return {
    username: state.status === "ready" ? state.username : null,
    accent: state.status === "ready" ? state.data.settings.accent : DEFAULT_ACCENT,
    loaded: state.status !== "loading",
    setAccent: saveAccent,
  };
}
