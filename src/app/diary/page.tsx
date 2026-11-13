"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DaySummary from "@/components/DaySummary";
import MealList from "@/components/MealList";
import StorageError from "@/components/StorageError";
import WeekStrip from "@/components/WeekStrip";
import { useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { openLog, setDiaryDate, showToast } from "@/lib/client/uiStore";
import { dailyTotals } from "@/lib/calories";
import { formatDateKey, isDateKey } from "@/lib/date";
import type { FoodEntry } from "@/lib/types";

function Loading() {
  return (
    <div className="space-y-5">
      <h1 className="title">Food diary</h1>
      <p className="card-focal flex min-h-72 items-center justify-center text-sm text-muted" role="status">
        Loading your diary…
      </p>
    </div>
  );
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
  const date = isDateKey(paramDate) && today && paramDate <= today ? paramDate : today;

  // The nav's "+" adds to the day shown here while the Diary is open.
  useEffect(() => {
    setDiaryDate(date);
    return () => setDiaryDate(null);
  }, [date]);

  if (error || profileError) {
    return (
      <div className="space-y-5">
        <h1 className="title">Food diary</h1>
        <StorageError />
      </div>
    );
  }

  if (!loaded || !today || !date) return <Loading />;

  const setDate = (next: string) =>
    router.replace(next === today ? "/diary" : `/diary?date=${next}`, { scroll: false });

  const dayEntries = entriesForDate(date);
  const isToday = date === today;

  function handleRemove(entry: FoodEntry) {
    void removeEntry(entry.id);
    showToast(`Removed ${entry.name}`, { label: "Undo", run: () => void restoreEntry(entry) });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <h1 className="title">Food diary</h1>
          <p className="text-sm text-muted">
            {isToday ? "Today, " : ""}
            {formatDateKey(date)}
          </p>
        </div>
        {!isToday && (
          <button type="button" className="btn-quiet" onClick={() => setDate(today)}>
            Back to today
          </button>
        )}
      </div>

      <WeekStrip date={date} today={today} totals={totals} targetFor={targetFor} onSelect={setDate} />

      {/*
        Same layout as Today: plate and macros, then meals; side by side from
        1024px. Adding food goes through the shared sheet ("+" / Log food / Add).
      */}
      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6 lg:space-y-0">
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
