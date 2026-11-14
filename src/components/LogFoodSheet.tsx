"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useToday } from "@/hooks/useClient";
import { useEntries, useProfile } from "@/hooks/useDiary";
import { closeLog, markRecent, showToast, uiStore, type LogRequest } from "@/lib/client/uiStore";
import { formatDayLong } from "@/lib/date";
import { MEAL_TYPES, type FoodEntry } from "@/lib/types";
import FoodEntryForm from "./FoodEntryForm";
import { MealArc } from "./MealGlyph";
import Sheet from "./Sheet";

type NewEntry = Omit<FoodEntry, "id" | "createdAt">;

export const mealLabel = (meal: string) => MEAL_TYPES.find((m) => m.value === meal)?.label ?? meal;

/** Saves foods from any Add food form and says so. */
export function useAddFoods() {
  const { addEntries } = useEntries();
  const { targetFor } = useProfile();
  return (added: NewEntry[]) => {
    if (added.length === 0) return;
    markRecent(addEntries(added));
    const { meal, date } = added[0];
    const what = added.length === 1 ? added[0].name : `${added.length} items`;
    const kcal = added.reduce((sum, e) => sum + e.calories, 0);
    showToast(`Added ${what} to ${mealLabel(meal)}`, undefined, <MealArc meal={meal} kcal={kcal} target={targetFor(date)} />);
  };
}

function SheetBody({ request, date }: { request: LogRequest; date: string }) {
  const addFoods = useAddFoods();
  return (
    <FoodEntryForm
      key={request.id}
      date={date}
      initialMeal={request.meal}
      showHeading={false}
      onAdd={(added) => {
        addFoods(added);
        closeLog();
      }}
    />
  );
}

/**
 * The Add food sheet, opened by the "+" in the nav from any screen, and by
 * the Add buttons on Today, Diary and History. Mounted once in the layout.
 */
export default function LogFoodSheet() {
  const pathname = usePathname();
  const today = useToday();
  const { log, diaryDate } = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);

  if (pathname === "/login" || pathname === "/signup" || !today) return null;

  const date = log?.date ?? diaryDate ?? today;
  const title = date === today ? "Add food" : `Add food · ${formatDayLong(date)}`;

  return (
    <Sheet open={log !== null} onClose={closeLog} title={title}>
      {log && <SheetBody request={log} date={date} />}
    </Sheet>
  );
}
