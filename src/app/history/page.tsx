"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CalendarMonth from "@/components/CalendarMonth";
import DayDetail from "@/components/DayDetail";
import PlateRing from "@/components/PlateRing";
import Sheet from "@/components/Sheet";
import StorageError from "@/components/StorageError";
import { ChevronLeftIcon, ChevronRightIcon, CleanPlateIcon } from "@/components/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
      <h1 className="type-title">History</h1>
      <p className="text-sm text-muted-foreground">Each day against that day&apos;s target.</p>
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        {heading}
        <StorageError />
      </div>
    );
  }

  if (!today) {
    return (
      <div className="flex flex-col gap-5" role="status" aria-label="Loading your saved diary">
        {heading}
        <Skeleton className="h-96 rounded-xl" />
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
    <div className="flex flex-col gap-5">
      {heading}

      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-6">
        {/* Tighter side padding on phones keeps each day about 44px wide. */}
        <Card size="sm" className="sm:[--card-spacing:--spacing(5)]" role="region" aria-label="Calendar">
          {/* On narrow phones the controls drop to their own line instead of squeezing the month. */}
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 px-2 sm:px-(--card-spacing)">
            <CardTitle className="type-section whitespace-nowrap" aria-live="polite">
              <h2>{formatMonthKey(month)}</h2>
            </CardTitle>
            <CardAction className="ml-auto flex items-center gap-2">
              {month !== currentMonth && (
                <Button variant="outline" onClick={() => changeMonth(currentMonth)}>
                  This month
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                aria-label="Previous month"
                onClick={() => changeMonth(shiftMonthKey(month, -1))}
              >
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Next month"
                disabled={month >= currentMonth}
                onClick={() => changeMonth(shiftMonthKey(month, 1))}
              >
                <ChevronRightIcon />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-4 px-2 sm:px-(--card-spacing)">
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

            <ul className="flex flex-wrap gap-x-5 gap-y-2 px-2 text-xs text-muted-foreground sm:px-0" aria-label="Legend">
              <li className="flex items-center gap-2">
                <PlateRing segments={[{ key: "d", value: 70, color: "var(--primary)" }]} target={100} size={22} stroke={3} />
                Within target
              </li>
              <li className="flex items-center gap-2">
                <PlateRing segments={[{ key: "d", value: 130, color: "var(--primary)" }]} target={100} size={22} stroke={3} />
                Over target (amber)
              </li>
              <li className="flex items-center gap-2">
                <span className="block size-5 rounded-md border border-muted-foreground" aria-hidden="true" />
                Today
              </li>
            </ul>

            <Separator />

            {!loaded ? (
              <Skeleton className="h-20" role="status" aria-label="Loading your saved diary" />
            ) : entries.length === 0 ? (
              <Empty className="items-start p-0 text-left">
                <EmptyHeader className="items-start">
                  <EmptyMedia className="text-muted-foreground">
                    <CleanPlateIcon />
                  </EmptyMedia>
                  <EmptyTitle>No history yet</EmptyTitle>
                  <EmptyDescription>
                    Each day you log shows here as a plate, filled by how much of your target you ate.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="items-start">
                  <Link href="/diary" className={buttonVariants()}>
                    Log today&apos;s food
                  </Link>
                </EmptyContent>
              </Empty>
            ) : logged === 0 ? (
              <p className="px-2 text-sm text-muted-foreground sm:px-0">
                Nothing logged in {formatMonthName(month)}. Pick a past day to add food to it.
              </p>
            ) : (
              <Item className="plate-glaze rounded-2xl bg-plate">
                <ItemMedia>
                  <PlateRing
                    segments={[{ key: "avg", value: kcalSum / logged, color: "var(--primary)" }]}
                    target={targetSum / logged}
                    size={56}
                    stroke={6}
                    label={`Average ${Math.round(kcalSum / logged).toLocaleString()} of ${Math.round(targetSum / logged).toLocaleString()} kcal`}
                  />
                </ItemMedia>
                <ItemContent>
                  <dl className="grid min-w-0 grid-cols-3 gap-2 tabular-nums sm:gap-3">
                    <div>
                      <dt className="text-xs text-muted-foreground">Days logged</dt>
                      <dd className="font-heading text-lg font-semibold">{logged}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Average a day</dt>
                      <dd className="font-heading text-lg font-semibold">
                        {Math.round(kcalSum / logged).toLocaleString()}
                        <span className="font-sans text-xs font-normal text-muted-foreground"> kcal</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Over target</dt>
                      <dd className={cn("font-heading text-lg font-semibold", overDays > 0 && "text-over")}>
                        {overDays} {overDays === 1 ? "day" : "days"}
                      </dd>
                    </div>
                  </dl>
                </ItemContent>
              </Item>
            )}
          </CardContent>
        </Card>

        {/* From 1024px the selected day sits beside the calendar; below that it opens as a sheet. */}
        {isWide && (
          <Card size="sm" role="region" aria-label="Selected day">
            {selected ? (
              <>
                <CardHeader>
                  <CardTitle className="type-section">
                    <h2>{formatDayLong(selected)}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent>{detail}</CardContent>
              </>
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                Pick a day to see what you ate.
              </CardContent>
            )}
          </Card>
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
