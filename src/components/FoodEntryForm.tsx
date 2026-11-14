"use client";

import { useId, useState, type FormEvent } from "react";
import { mealForTime } from "@/lib/calories";
import { AI_INPUT_MAX, type FoodEstimate } from "@/lib/estimate";
import { MEAL_TYPES, type FoodEntry, type MealType } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemGroup } from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import MealGlyph from "./MealGlyph";
import { ChevronRightIcon, CleanPlateIcon, CloseIcon } from "./icons";

type NewEntry = Omit<FoodEntry, "id" | "createdAt">;
type Mode = "ai" | "manual";

interface Props {
  date: string;
  /** Called with one entry from manual input, or one per food from an AI estimate. */
  onAdd: (entries: NewEntry[]) => void;
  /** Overrides the time-of-day guess, e.g. when arriving from "Add dinner". */
  initialMeal?: MealType;
  /** Hide the heading when the form sits inside a sheet that already has one. */
  showHeading?: boolean;
}

/** One estimated food under review; fields are strings so they can be edited. */
interface ReviewItem {
  key: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

type NumberField = "calories" | "protein" | "carbs" | "fat";

const optionalNumber = (v: string) => (v.trim() === "" ? undefined : Number(v));

const REVIEW_NUMBERS: { field: NumberField; label: string; decimal: boolean }[] = [
  { field: "calories", label: "kcal", decimal: false },
  { field: "protein", label: "Protein (g)", decimal: true },
  { field: "carbs", label: "Carbs (g)", decimal: true },
  { field: "fat", label: "Fat (g)", decimal: true },
];

const itemValid = (item: ReviewItem) =>
  item.name.trim() !== "" && item.calories.trim() !== "" && Number(item.calories) >= 0;

export default function FoodEntryForm({ date, onAdd, initialMeal, showHeading = true }: Props) {
  const id = useId();
  const [mode, setMode] = useState<Mode>("manual");
  const [meal, setMeal] = useState<MealType>(() => initialMeal ?? mealForTime());

  // Manual input: one food.
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const manualValid = name.trim() !== "" && Number(calories) > 0;

  // AI input: describe the food, get estimates, review them, then add.
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  /** The estimates under review, with the description they came from. */
  const [review, setReview] = useState<{ source: string; items: ReviewItem[] } | null>(null);

  const reviewTotal = review?.items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0) ?? 0;
  const reviewValid = !!review && review.items.length > 0 && review.items.every(itemValid);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setAiError(null);
    setReview(null);
  }

  async function requestEstimate(e: FormEvent) {
    e.preventDefault();
    const text = aiText.trim();
    if (!text || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const response = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json().catch(() => null);
      const items: FoodEstimate[] | undefined = data?.items;
      if (!response.ok || !Array.isArray(items) || items.length === 0) {
        setAiError(data?.error ?? "No estimate came back. Try again or enter it manually.");
        return;
      }
      setReview({
        source: text,
        items: items.map((item, key) => ({
          key,
          name: item.name,
          calories: String(item.calories),
          protein: String(item.protein),
          carbs: String(item.carbs),
          fat: String(item.fat),
        })),
      });
    } catch {
      setAiError("Couldn't connect. Try again or enter it manually.");
    } finally {
      setAiBusy(false);
    }
  }

  function updateItem(key: number, field: keyof Omit<ReviewItem, "key">, value: string) {
    setReview(
      (r) => r && { ...r, items: r.items.map((i) => (i.key === key ? { ...i, [field]: value } : i)) },
    );
  }

  function removeItem(key: number) {
    setReview((r) => {
      if (!r) return r;
      const items = r.items.filter((i) => i.key !== key);
      // Removing the last food is the same as declining the estimate.
      return items.length > 0 ? { ...r, items } : null;
    });
  }

  function submitReview(e: FormEvent) {
    e.preventDefault();
    if (!review || !reviewValid) return;
    onAdd(
      review.items.map((item) => ({
        date,
        meal,
        name: item.name.trim(),
        calories: Number(item.calories),
        protein: optionalNumber(item.protein),
        carbs: optionalNumber(item.carbs),
        fat: optionalNumber(item.fat),
      })),
    );
    setReview(null);
    setAiText("");
  }

  function submitManual(e: FormEvent) {
    e.preventDefault();
    if (!manualValid) return;
    onAdd([
      {
        date,
        meal,
        name: name.trim(),
        calories: Number(calories),
        protein: optionalNumber(protein),
        carbs: optionalNumber(carbs),
        fat: optionalNumber(fat),
      },
    ]);
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
  }

  // Four meals: a toggle group with each meal's glyph, not a dropdown.
  const mealField = (
    <FieldSet>
      <FieldLegend variant="label">Meal</FieldLegend>
      <ToggleGroup
        aria-label="Meal"
        variant="outline"
        spacing={2}
        className="grid w-full grid-cols-4"
        value={[meal]}
        onValueChange={(value) => value[0] && setMeal(value[0] as MealType)}
      >
        {MEAL_TYPES.map((m) => (
          <ToggleGroupItem key={m.value} value={m.value} className="h-auto min-w-0 flex-col gap-1 px-1 py-2 text-xs">
            <MealGlyph meal={m.value} size={20} />
            {m.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </FieldSet>
  );

  const manualMacros = [
    ["protein", "Protein (g)", protein, setProtein],
    ["carbs", "Carbs (g)", carbs, setCarbs],
    ["fat", "Fat (g)", fat, setFat],
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      {showHeading && <h2 className="type-section">Add food</h2>}

      <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)} className="gap-4">
        <TabsList aria-label="How to enter the food" className="w-full">
          <TabsTrigger value="ai">AI input</TabsTrigger>
          <TabsTrigger value="manual">Manual input</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          {/* AI input, step 1: describe what was eaten. */}
          {!review && (
            <form onSubmit={requestEstimate}>
              <FieldGroup className="gap-4">
                <Field data-disabled={aiBusy || undefined}>
                  <div className="flex items-baseline justify-between gap-2">
                    <FieldLabel htmlFor={`${id}-ai`}>What did you eat?</FieldLabel>
                    <span className="text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                      {aiText.length}/{AI_INPUT_MAX}
                    </span>
                  </div>
                  <Input
                    id={`${id}-ai`}
                    placeholder="e.g. nasi goreng and iced tea"
                    autoComplete="off"
                    maxLength={AI_INPUT_MAX}
                    aria-describedby={`${id}-ai-help`}
                    value={aiText}
                    disabled={aiBusy}
                    onChange={(e) => setAiText(e.target.value)}
                  />
                  <FieldDescription id={`${id}-ai-help`} className="text-xs">
                    DeepSeek estimates each food separately. You review the numbers before anything is added.
                  </FieldDescription>
                </Field>
                <Button type="submit" className="w-full" disabled={aiText.trim() === "" || aiBusy}>
                  {aiBusy && <Spinner data-icon="inline-start" />}
                  {aiBusy ? "Estimating…" : "Estimate with AI"}
                </Button>
                <p role="status" className="sr-only">
                  {aiBusy ? "Estimating calories" : ""}
                </p>
                {aiError && (
                  <Alert variant="destructive">
                    <CleanPlateIcon className="size-12 text-muted-foreground!" />
                    <AlertTitle>No estimate</AlertTitle>
                    <AlertDescription>{aiError}</AlertDescription>
                  </Alert>
                )}
              </FieldGroup>
            </form>
          )}

          {/* AI input, step 2: review each estimated food, then agree or decline. */}
          {review && (
            <form onSubmit={submitReview}>
              <FieldGroup className="gap-4">
                <Alert role="status">
                  <AlertTitle>
                    AI estimate for &ldquo;{review.source}&rdquo;: {review.items.length}{" "}
                    {review.items.length === 1 ? "item" : "items"}
                  </AlertTitle>
                  <AlertDescription>
                    These are estimates. Edit or remove anything wrong before adding.
                  </AlertDescription>
                </Alert>

                <ItemGroup className="gap-2">
                  {review.items.map((item, index) => (
                    <Item key={item.key} variant="outline" size="sm" role="listitem" className="rounded-xl">
                      <ItemContent className="min-w-0 gap-2">
                        <div className="flex items-end gap-2">
                          <Field className="min-w-0 flex-1 gap-1.5" data-invalid={item.name.trim() === "" || undefined}>
                            <FieldLabel htmlFor={`${id}-r${item.key}-name`}>
                              Food {review.items.length > 1 ? index + 1 : ""}
                            </FieldLabel>
                            <Input
                              id={`${id}-r${item.key}-name`}
                              autoComplete="off"
                              aria-invalid={item.name.trim() === "" || undefined}
                              value={item.name}
                              onChange={(e) => updateItem(item.key, "name", e.target.value)}
                            />
                          </Field>
                          <Button
                            variant="outline"
                            size="icon"
                            className="hover:text-destructive"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Leave out ${item.name || `food ${index + 1}`}`}
                          >
                            <CloseIcon />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {REVIEW_NUMBERS.map(({ field, label, decimal }) => {
                            const invalid = field === "calories" && !itemValid(item) && item.name.trim() !== "";
                            return (
                              <Field key={field} className="min-w-0 gap-1.5" data-invalid={invalid || undefined}>
                                <FieldLabel htmlFor={`${id}-r${item.key}-${field}`} className="text-xs">
                                  {label}
                                </FieldLabel>
                                <Input
                                  id={`${id}-r${item.key}-${field}`}
                                  className="px-2 tabular-nums"
                                  type="number"
                                  inputMode={decimal ? "decimal" : "numeric"}
                                  min={0}
                                  step={decimal ? "0.1" : "1"}
                                  aria-invalid={invalid || undefined}
                                  value={item[field]}
                                  onChange={(e) => updateItem(item.key, field, e.target.value)}
                                />
                              </Field>
                            );
                          })}
                        </div>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>

                <p className="text-sm text-muted-foreground tabular-nums">
                  Total:{" "}
                  <span className="font-semibold text-foreground">{Math.round(reviewTotal).toLocaleString()} kcal</span>
                </p>

                {mealField}

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setReview(null)}>
                    Discard
                  </Button>
                  <Button type="submit" disabled={!reviewValid}>
                    {review.items.length === 1 ? "Add to diary" : `Add ${review.items.length} items`}
                  </Button>
                </div>
                {!reviewValid && (
                  <p className="text-xs text-muted-foreground">Each item needs a name and calories.</p>
                )}
              </FieldGroup>
            </form>
          )}
        </TabsContent>

        <TabsContent value="manual">
          <form onSubmit={submitManual}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor={`${id}-name`}>Food</FieldLabel>
                <Input
                  id={`${id}-name`}
                  placeholder="e.g. Nasi goreng"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`${id}-kcal`}>Calories (kcal)</FieldLabel>
                <Input
                  id={`${id}-kcal`}
                  className="tabular-nums"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </Field>

              {mealField}

              <Collapsible className="rounded-lg border">
                <CollapsibleTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="group/macros w-full justify-start text-muted-foreground hover:text-foreground"
                    />
                  }
                >
                  <ChevronRightIcon
                    data-icon="inline-start"
                    className="transition-ui group-data-panel-open/macros:rotate-90"
                  />
                  Add macros (optional)
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                    {manualMacros.map(([key, label, value, setValue]) => (
                      <Field key={key} className="gap-1.5">
                        <FieldLabel htmlFor={`${id}-${key}`} className="text-xs">
                          {label}
                        </FieldLabel>
                        <Input
                          id={`${id}-${key}`}
                          className="tabular-nums"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.1"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit" className="w-full" disabled={!manualValid}>
                Add to diary
              </Button>
              {!manualValid && (
                <p className="text-xs text-muted-foreground">Enter a name and calories.</p>
              )}
            </FieldGroup>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
