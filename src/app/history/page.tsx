"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CalendarMonth from "@/components/CalendarMonth";
import DayDetail from "@/components/DayDetail";
import PlateRing from "@/components/PlateRing";
import Sheet from "@/components/Sheet";
import StorageError from "@/components/StorageError";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { useMediaQuery, useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { dailyTotals } from "@/lib/calories";
import {
  formatDayLong,
  formatMonthKey,
  formatMonthName,
  shiftMonthKey,
  toMonthKey,
} from "@/lib/date";

export default function HistoryPage() {
  const today = useToday();
  const { entries, entriesForDate, loaded, error } = useEntries();
  const { targetFor } = useProfile();
  const isWide = useMediaQuery("(min-width: 1024px)");

  const [chosenMonth, setChosenMonth] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const totals = useMemo(() => dailyTotals(entries), [entries]);

  const heading = (
    <div>
      <h1 className="title">History</h1>
      <p className="text-sm text-muted">Each day against the target you had at the time.</p>
    </div>
  );

  if (error) {
    return (
      <div className="space-y-5">
        {heading}
        <StorageError />
      </div>
    );
  }

  if (!today) {
    return (
      <div className="space-y-5">
        {heading}
        <p className="card min-h-72 text-sm text-muted" role="status">
          Loading your saved diary…
        </p>
      </div>
    );
  }

  const currentMonth = toMonthKey(today);
  const month = chosenMonth ?? currentMonth;

  const changeMonth = (next: string) => {
    setChosenMonth(next);
    setSelected(null);
  };

  // Month summary, from the user's own entries only.
  let logged = 0;
  let kcalSum = 0;
  let overDays = 0;
  let targetSum = 0;
  totals.forEach((t, date) => {
    if (toMonthKey(date) !== month) return;
    logged += 1;
    kcalSum += t.calories;
    targetSum += targetFor(date);
    if (Math.round(t.calories) > targetFor(date)) overDays += 1;
  });

  const detail = selected && (
    <DayDetail
      date={selected}
      today={today}
      entries={entriesForDate(selected)}
      target={targetFor(selected)}
    />
  );

  return (
    <div className="space-y-5">
      {heading}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        {/* Tighter side padding on phones keeps each day about 44px wide. */}
        <section className="card px-2 sm:px-5" aria-label="Calendar">
          {/* On narrow phones the controls drop to their own line instead of squeezing the month. */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2 sm:px-0">
            <h2 className="section-title whitespace-nowrap" aria-live="polite">
              {formatMonthKey(month)}
            </h2>
            <div className="ml-auto flex items-center gap-2">
              {month !== currentMonth && (
                <button
                  type="button"
                  className="btn-quiet whitespace-nowrap"
                  onClick={() => changeMonth(currentMonth)}
                >
                  This month
                </button>
              )}
              <button
                type="button"
                className="btn-icon"
                aria-label="Previous month"
                onClick={() => changeMonth(shiftMonthKey(month, -1))}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="btn-icon"
                aria-label="Next month"
                disabled={month >= currentMonth}
                onClick={() => changeMonth(shiftMonthKey(month, 1))}
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>

          <CalendarMonth
            monthKey={month}
            today={today}
            totals={totals}
            targetFor={targetFor}
            selected={selected}
            onSelect={setSelected}
            onMonthChange={changeMonth}
            busy={!loaded}
          />

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 px-2 text-xs text-muted sm:px-0" aria-label="Legend">
            <li className="flex items-center gap-2">
              <PlateRing segments={[{ key: "d", value: 70, color: "var(--color-brand)" }]} target={100} size={22} stroke={3} />
              Within target
            </li>
            <li className="flex items-center gap-2">
              <PlateRing segments={[{ key: "d", value: 130, color: "var(--color-brand)" }]} target={100} size={22} stroke={3} />
              Over target (amber outside)
            </li>
            <li className="flex items-center gap-2">
              <span className="block size-5 rounded-md border border-muted" aria-hidden="true" />
              Today
            </li>
          </ul>

          <div className="mx-2 mt-4 text-sm sm:mx-0">
            {!loaded ? (
              <p className="border-t border-line pt-4 text-muted" role="status">
                Loading your saved diary…
              </p>
            ) : entries.length === 0 ? (
              <div className="border-t border-line pt-4">
                <p className="text-muted">
                  Your history fills in as you log food. Each day you log becomes a small plate,
                  filled by how much of your target you ate.
                </p>
                <Link href="/diary" className="btn-primary mt-3">
                  Log today&apos;s food
                </Link>
              </div>
            ) : logged === 0 ? (
              <p className="border-t border-line pt-4 text-muted">
                Nothing logged in {formatMonthName(month)}. Pick a past day to add food to it.
              </p>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-focal p-4 sm:gap-4">
                <PlateRing
                  segments={[{ key: "avg", value: kcalSum / logged, color: "var(--color-brand)" }]}
                  target={targetSum / logged}
                  size={56}
                  stroke={6}
                  label={`Average ${Math.round(kcalSum / logged).toLocaleString()} of ${Math.round(targetSum / logged).toLocaleString()} kcal`}
                />
                <dl className="num grid min-w-0 flex-1 grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <dt className="text-xs text-muted">Days logged</dt>
                    <dd className="font-display text-lg font-semibold">{logged}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Average a day</dt>
                    <dd className="font-display text-lg font-semibold">
                      {Math.round(kcalSum / logged).toLocaleString()}
                      <span className="font-sans text-xs font-normal text-muted"> kcal</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Over target</dt>
                    <dd className={`font-display text-lg font-semibold ${overDays > 0 ? "text-over" : ""}`}>
                      {overDays} {overDays === 1 ? "day" : "days"}
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </section>

        {/* From 1024px the selected day sits beside the calendar; below that it opens as a sheet. */}
        {isWide && (
          <aside className="card" aria-label="Selected day">
            {selected ? (
              <>
                <h2 className="section-title mb-3">{formatDayLong(selected)}</h2>
                {detail}
              </>
            ) : (
              <p className="text-sm text-muted">Pick a day in the calendar to see what you ate.</p>
            )}
          </aside>
        )}
      </div>

      <Sheet
        open={!isWide && selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? formatDayLong(selected) : ""}
      >
        {detail}
      </Sheet>
    </div>
  );
}
