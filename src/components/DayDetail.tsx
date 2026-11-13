"use client";

import Link from "next/link";
import { openLog } from "@/lib/client/uiStore";
import { formatDayShort } from "@/lib/date";
import type { FoodEntry } from "@/lib/types";
import DaySummary from "./DaySummary";
import MealList from "./MealList";

interface Props {
  date: string;
  today: string;
  entries: FoodEntry[];
  target: number;
}

/** What was eaten on one past day, with ways to add to it or open it in the Diary. */
export default function DayDetail({ date, today, entries, target }: Props) {
  const diaryHref = date === today ? "/diary" : `/diary?date=${date}`;

  if (entries.length === 0) {
    return (
      <div>
        <p className="text-sm text-muted">
          Nothing logged on {formatDayShort(date)}. If you remember what you ate, you can still
          add it.
        </p>
        <button type="button" className="btn-primary mt-4 w-full" onClick={() => openLog({ date })}>
          Add food to this day
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <DaySummary entries={entries} target={target} size="compact" />
      <MealList entries={entries} />
      <Link href={diaryHref} className="btn-quiet w-full">
        Open in Diary
      </Link>
    </div>
  );
}
