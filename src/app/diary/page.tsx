"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import DayLoading from "@/components/DayLoading";
import DaySummary from "@/components/DaySummary";
import { MealArc } from "@/components/MealGlyph";
import MealList from "@/components/MealList";
import StorageError from "@/components/StorageError";
import WeekStrip from "@/components/WeekStrip";
import { useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { openLog, setDiaryDate, showToast } from "@/lib/client/uiStore";
import { dailyTotals } from "@/lib/calories";
import { formatDateKey, isDateKey } from "@/lib/date";
import type { FoodEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";

function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="type-title">Food diary</h1>
      <DayLoading label="Loading your diary" />
    </div>
  );
}

/**
 * Runs `update` (which shows `day`) as a view transition in which the day's
 * small plate in the week strip grows into the big plate. Without View
 * Transitions, or under reduced motion, it just runs `update`.
 */
function withPlateMorph(day: string, update: () => void) {
  const small = document.querySelector<HTMLElement>(`[data-day-plate="${day}"]`);
  const big = document.querySelector<HTMLElement>("[data-main-plate]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || !small || !big || reduced) return update();
  // One element may carry the name at a time; a skipped earlier morph may have left it on the big plate.
  big.style.viewTransitionName = "";
  small.style.viewTransitionName = "day-plate";
  const transition = document.startViewTransition(() => {
    small.style.viewTransitionName = "";
    big.style.viewTransitionName = "day-plate";
    update();
  });
  void transition.finished.finally(() => {
    big.style.viewTransitionName = "";
  });
}

function Diary() {
  const router = useRouter();
  const params = useSearchParams();
  const today = useToday();
  const { entries, entriesForDate, removeEntry, restoreEntry, loaded, error } = useEntries();
  const { targetFor, error: profileError } = useProfile();
  const totals = useMemo(() => dailyTotals(entries), [entries]);

  // The day lives in the URL (?date=YYYY-MM-DD) so History can link to it.
  const paramDate = params.get("date");
  const urlDate = isDateKey(paramDate) && today && paramDate <= today ? paramDate : today;
  // The day picked a moment ago, shown at once while the URL catches up; ignored once the URL changes.
  const [picked, setPicked] = useState<{ from: string | null; date: string } | null>(null);
  const date = picked && picked.from === urlDate ? picked.date : urlDate;

  // The nav's "+" adds to the day shown here while the Diary is open.
  useEffect(() => {
    setDiaryDate(date);
    return () => setDiaryDate(null);
  }, [date]);

  if (error || profileError) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="type-title">Food diary</h1>
        <StorageError />
      </div>
    );
  }

  if (!loaded || !today || !date) return <Loading />;

  const setDate = (next: string) =>
    withPlateMorph(next, () => {
      flushSync(() => setPicked({ from: urlDate, date: next }));
      router.replace(next === today ? "/diary" : `/diary?date=${next}`, { scroll: false });
    });

  const dayEntries = entriesForDate(date);
  const isToday = date === today;

  function handleRemove(entry: FoodEntry) {
    void removeEntry(entry.id);
    showToast(
      `Removed ${entry.name}`,
      { label: "Undo", run: () => void restoreEntry(entry) },
      <MealArc meal={entry.meal} kcal={entry.calories} target={targetFor(entry.date)} />,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h1 className="type-title">Food diary</h1>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Today, " : ""}
            {formatDateKey(date)}
          </p>
        </div>
        {!isToday && (
          <Button variant="outline" onClick={() => setDate(today)}>
            Back to today
          </Button>
        )}
      </div>

      <WeekStrip date={date} today={today} totals={totals} targetFor={targetFor} onSelect={setDate} />

      {/*
        Same layout as Today: plate and macros, then meals; side by side from
        1024px. Adding food goes through the shared sheet ("+" / Log food / Add).
      */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <DaySummary entries={dayEntries} target={targetFor(date)} />
        <MealList entries={dayEntries} onRemove={handleRemove} onAdd={(meal) => openLog({ meal, date })} />
      </div>
    </div>
  );
}

export default function DiaryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Diary />
    </Suspense>
  );
}
