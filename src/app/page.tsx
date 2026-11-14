"use client";

import BrowserImport from "@/components/BrowserImport";
import DayLoading from "@/components/DayLoading";
import DaySummary from "@/components/DaySummary";
import MealList from "@/components/MealList";
import StorageError from "@/components/StorageError";
import TodayHeader from "@/components/TodayHeader";
import { useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { openLog } from "@/lib/client/uiStore";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";

export default function TodayPage() {
  const today = useToday();
  const { entriesForDate, loaded, error } = useEntries();
  const { targetFor, hasProfile, error: profileError } = useProfile();

  const header = <TodayHeader today={today} entries={loaded && today ? entriesForDate(today) : undefined} />;

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
      {!hasProfile && (
        <Alert role="region" aria-label="Daily target not set">
          <AlertTitle>This target is a placeholder</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>It uses sample body details. Answer four quick questions to get yours.</p>
            <Link href="/welcome" className={buttonVariants()}>
              Set your daily target
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-6">
        <div className="flex flex-col gap-3">
          <DaySummary entries={todays} target={targetFor(today)} />
          {todays.length === 0 && (
            <p className="px-1 text-sm text-muted-foreground">
              Nothing logged yet. Tap Add on a meal to start.
            </p>
          )}
        </div>
        <MealList entries={todays} collapseEmpty onAdd={(meal) => openLog({ meal, date: today })} />
      </div>
    </div>
  );
}
