"use client";

import { useSyncExternalStore } from "react";
import { uiStore } from "@/lib/client/uiStore";
import { groupByMeal } from "@/lib/meals";
import type { FoodEntry, MealType } from "@/lib/types";
import MealGlyph from "./MealGlyph";
import { CloseIcon, PlusIcon } from "./icons";

interface Props {
  entries: FoodEntry[];
  /** Shows a remove button on each food. */
  onRemove?: (entry: FoodEntry) => void;
  /** Shows an "Add" button on each meal. */
  onAdd?: (meal: MealType) => void;
  /** Meals with nothing logged collapse to one line (Today); otherwise all show fully. */
  collapseEmpty?: boolean;
}

/**
 * The day's meals in one card: each meal's glyph in its ring colour, its
 * total, and its foods. Foods that were just added briefly highlight.
 */
export default function MealList({ entries, onRemove, onAdd, collapseEmpty = false }: Props) {
  const { recent } = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);
  const groups = groupByMeal(entries);

  return (
    <section className="card divide-y divide-line py-1 sm:py-1" aria-label="Meals">
      {groups.map((g) => {
        const empty = g.entries.length === 0;
        return (
          <div key={g.value} className="py-3">
            <div className="flex items-center gap-3">
              <MealGlyph meal={g.value} />
              <h3 className="min-w-0 flex-1 font-display text-base font-semibold">
                {g.label}
                {empty && collapseEmpty && <span className="font-sans text-sm font-normal text-muted"> · nothing yet</span>}
              </h3>
              {!empty && <span className="num text-sm font-medium">{g.calories.toLocaleString()} kcal</span>}
              {onAdd && (
                <button
                  type="button"
                  className="-mr-1 inline-flex min-h-11 items-center gap-1 rounded-[10px] px-2 text-sm font-medium text-brand hover:bg-surface-2 active:translate-y-px"
                  onClick={() => onAdd(g.value)}
                  aria-label={`Add to ${g.label.toLowerCase()}`}
                >
                  <PlusIcon width={16} height={16} />
                  Add
                </button>
              )}
            </div>

            {empty && !collapseEmpty && <p className="mt-1 pl-12 text-sm text-muted">Nothing logged yet.</p>}

            {!empty && (
              <ul className="mt-1 pl-12">
                {g.entries.map((e) => (
                  <li
                    key={e.id}
                    className={`-mx-2 flex items-center justify-between gap-3 rounded-[10px] px-2 py-1.5 text-sm ${
                      recent.includes(e.id) ? "just-added" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="break-words">{e.name}</p>
                      {(e.protein ?? e.carbs ?? e.fat) !== undefined && (
                        <p className="num text-xs text-muted">
                          P {e.protein ?? 0}g · C {e.carbs ?? 0}g · F {e.fat ?? 0}g
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="num text-muted">{e.calories.toLocaleString()}</span>
                      {onRemove && (
                        <button
                          type="button"
                          onClick={() => onRemove(e)}
                          className="-mr-2 inline-flex size-11 items-center justify-center rounded-[10px] text-muted hover:bg-surface-2 hover:text-danger active:translate-y-px"
                          aria-label={`Remove ${e.name}`}
                        >
                          <CloseIcon width={18} height={18} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
