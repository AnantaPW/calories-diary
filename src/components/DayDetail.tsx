"use client";

import Link from "next/link";
import { openLog } from "@/lib/client/uiStore";
import { formatDayShort } from "@/lib/date";
import type { FoodEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { CleanPlateIcon } from "./icons";
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
      <Empty className="p-0 sm:p-0">
        <EmptyHeader>
          <EmptyMedia className="text-muted-foreground">
            <CleanPlateIcon />
          </EmptyMedia>
          <EmptyTitle>Nothing logged</EmptyTitle>
          <EmptyDescription>
            Nothing logged on {formatDayShort(date)}. If you remember what you ate, you can still add it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button className="w-full" onClick={() => openLog({ date })}>
            Add food to this day
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <DaySummary entries={entries} target={target} size="compact" />
      <MealList entries={entries} />
      <Link href={diaryHref} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
        Open in Diary
      </Link>
    </div>
  );
}
