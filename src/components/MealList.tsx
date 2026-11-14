"use client";

import { Fragment, useEffect, useSyncExternalStore } from "react";
import { setLitMeal, uiStore } from "@/lib/client/uiStore";
import { groupByMeal } from "@/lib/meals";
import type { FoodEntry, MealType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
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
 * total, and its foods as rows. Foods that were just added briefly highlight.
 */
export default function MealList({ entries, onRemove, onAdd, collapseEmpty = false }: Props) {
  const { recent, litMeal } = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);
  const groups = groupByMeal(entries);
  useEffect(() => () => setLitMeal(null), []);

  return (
    <Card size="sm" className="gap-0 py-1" role="region" aria-label="Meals">
      {groups.map((g, i) => {
        const empty = g.entries.length === 0;
        return (
          <Fragment key={g.value}>
            {i > 0 && <Separator />}
            {/* Pointing at, focusing or tapping a meal lights its arc on the plate (only meals that have one). */}
            <div
              className="py-1"
              onPointerEnter={(e) => !empty && e.pointerType === "mouse" && setLitMeal(g.value)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setLitMeal(null)}
              onFocus={() => !empty && setLitMeal(g.value)}
              onBlur={() => setLitMeal(null)}
            >
              <Item
                size="sm"
                onClick={(e) => {
                  if (empty || (e.target as HTMLElement).closest("button")) return;
                  setLitMeal(litMeal === g.value ? null : g.value);
                }}
              >
                <ItemMedia>
                  <MealGlyph meal={g.value} />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="font-heading text-base font-semibold">
                    <h3>
                      {g.label}
                      {empty && collapseEmpty && (
                        <span className="font-sans text-sm font-normal text-muted-foreground"> · nothing yet</span>
                      )}
                    </h3>
                  </ItemTitle>
                  {empty && !collapseEmpty && <ItemDescription>Nothing logged yet.</ItemDescription>}
                </ItemContent>
                <ItemActions>
                  {!empty && <span className="text-sm font-medium tabular-nums">{g.calories.toLocaleString()} kcal</span>}
                  {onAdd && (
                    <Button
                      variant="ghost"
                      className="-mr-2 text-primary"
                      onClick={() => onAdd(g.value)}
                      aria-label={`Add to ${g.label.toLowerCase()}`}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Add
                    </Button>
                  )}
                </ItemActions>
              </Item>

              {!empty && (
                <ItemGroup role="list" className="gap-0 pb-2 pl-14 pr-1.5">
                  {g.entries.map((e) => (
                    <Item
                      key={e.id}
                      size="xs"
                      role="listitem"
                      className={cn("flex-nowrap rounded-lg px-2 py-1", recent.includes(e.id) && "just-added")}
                    >
                      <ItemContent className="min-w-0">
                        <ItemTitle className="line-clamp-none font-normal break-words">{e.name}</ItemTitle>
                        {(e.protein ?? e.carbs ?? e.fat) !== undefined && (
                          <ItemDescription className="text-xs tabular-nums">
                            P {e.protein ?? 0}g · C {e.carbs ?? 0}g · F {e.fat ?? 0}g
                          </ItemDescription>
                        )}
                      </ItemContent>
                      <ItemActions className="gap-1">
                        <span className="text-muted-foreground tabular-nums">{e.calories.toLocaleString()}</span>
                        {onRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-mr-2 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(e)}
                            aria-label={`Remove ${e.name}`}
                          >
                            <CloseIcon />
                          </Button>
                        )}
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </div>
          </Fragment>
        );
      })}
    </Card>
  );
}
