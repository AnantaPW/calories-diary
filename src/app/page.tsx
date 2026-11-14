"use client";

import BrowserImport from "@/components/BrowserImport";
import DayLoading from "@/components/DayLoading";
import DaySummary from "@/components/DaySummary";
import MealList from "@/components/MealList";
import StorageError from "@/components/StorageError";
import { useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { openLog } from "@/lib/client/uiStore";
import { formatDateKey } from "@/lib/date";

export default function TodayPage() {
  const today = useToday();
  const { entriesForDate, loaded, error } = useEntries();
  const { targetFor, error: profileError } = useProfile();

  const header = (
    <div>
      <h1 className="type-title">Today</h1>
      {/* Reserves its line so the header doesn't jump once the date is known. */}
      <p className="min-h-5 text-sm text-muted-foreground">{today && formatDateKey(today)}</p>
    </div>
  );

  if (error || profileError) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <StorageError />
      </div>
    );
  }

  if (!loaded || !today) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <DayLoading label="Loading today's diary" />
      </div>
    );
  }

  const todays = entriesForDate(today);

  return (
    <div className="flex flex-col gap-5">
      {header}
      <BrowserImport />

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-3">
          <DaySummary entries={todays} target={targetFor(today)} />
          {todays.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">
              Nothing logged today yet. Use Log food, or Add on a meal, to start the count.
            </p>
          )}
        </div>
        <MealList entries={todays} collapseEmpty onAdd={(meal) => openLog({ meal, date: today })} />
      </div>
    </div>
  );
}
