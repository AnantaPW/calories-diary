"use client";

import { useId, useState, type FormEvent } from "react";
import { mealForTime } from "@/lib/calories";
import { AI_INPUT_MAX, type FoodEstimate } from "@/lib/estimate";
import { MEAL_TYPES, type FoodEntry, type MealType } from "@/lib/types";
import { CloseIcon } from "./icons";

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

const MODES: { value: Mode; label: string }[] = [
  { value: "ai", label: "AI input" },
  { value: "manual", label: "Manual input" },
];

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
        setAiError(data?.error ?? "The estimate didn't come back. Try again, or use manual input.");
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
      setAiError("Couldn't reach the server. Check your connection, or use manual input.");
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

  const mealField = (
    <div>
      <label htmlFor={`${id}-meal`} className="field-label">
        Meal
      </label>
      <select
        id={`${id}-meal`}
        className="input"
        value={meal}
        onChange={(e) => setMeal(e.target.value as MealType)}
      >
        {MEAL_TYPES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );

  const manualMacros = [
    ["protein", "Protein (g)", protein, setProtein],
    ["carbs", "Carbs (g)", carbs, setCarbs],
    ["fat", "Fat (g)", fat, setFat],
  ] as const;

  return (
    <div className="space-y-3">
      {showHeading && <h2 className="font-semibold">Add food</h2>}

      <div
        role="group"
        aria-label="How to enter the food"
        className="grid grid-cols-2 gap-1 rounded-lg bg-surface-2 p-1"
      >
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            aria-pressed={mode === m.value}
            onClick={() => switchMode(m.value)}
            className={`min-h-11 rounded-md px-2 text-sm active:translate-y-px ${
              mode === m.value
                ? "bg-surface font-semibold text-ink ring-1 ring-line"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* AI input, step 1: describe what was eaten. */}
      {mode === "ai" && !review && (
        <form onSubmit={requestEstimate} className="space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`${id}-ai`} className="field-label">
                What did you eat?
              </label>
              <span className="num text-xs text-muted" aria-hidden="true">
                {aiText.length}/{AI_INPUT_MAX}
              </span>
            </div>
            <input
              id={`${id}-ai`}
              className="input"
              placeholder="e.g. nasi goreng and iced tea"
              autoComplete="off"
              maxLength={AI_INPUT_MAX}
              aria-describedby={`${id}-ai-help`}
              value={aiText}
              disabled={aiBusy}
              onChange={(e) => setAiText(e.target.value)}
            />
            <p id={`${id}-ai-help`} className="mt-1 text-xs text-muted">
              Up to {AI_INPUT_MAX} characters. List more than one food or drink and each gets its
              own entry. Your text is sent to DeepSeek, which estimates the calories, protein,
              carbs and fat. You check the numbers before anything is added.
            </p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={aiText.trim() === "" || aiBusy}>
            {aiBusy ? "Estimating…" : "Estimate with AI"}
          </button>
          <p role="status" className="sr-only">
            {aiBusy ? "Estimating calories" : ""}
          </p>
          {aiError && (
            <p role="alert" className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-over">
              {aiError}
            </p>
          )}
        </form>
      )}

      {/* AI input, step 2: review each estimated food, then agree or decline. */}
      {mode === "ai" && review && (
        <form onSubmit={submitReview} className="space-y-3">
          <p role="status" className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm">
            <span className="font-semibold">
              AI estimate for &ldquo;{review.source}&rdquo;: {review.items.length}{" "}
              {review.items.length === 1 ? "item" : "items"}.
            </span>{" "}
            <span className="text-muted">
              These numbers are a guess, not measured values. Check or edit them, remove anything
              that&apos;s wrong, then choose whether to add them to your diary.
            </span>
          </p>

          <ul className="space-y-2">
            {review.items.map((item, index) => (
              <li key={item.key} className="rounded-lg border border-line p-3">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`${id}-r${item.key}-name`} className="field-label">
                      Food {review.items.length > 1 ? index + 1 : ""}
                    </label>
                    <input
                      id={`${id}-r${item.key}-name`}
                      className="input"
                      autoComplete="off"
                      value={item.name}
                      onChange={(e) => updateItem(item.key, "name", e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-icon hover:text-danger"
                    onClick={() => removeItem(item.key)}
                    aria-label={`Leave out ${item.name || `food ${index + 1}`}`}
                  >
                    <CloseIcon width={18} height={18} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {REVIEW_NUMBERS.map(({ field, label, decimal }) => (
                    <div key={field} className="min-w-0">
                      <label htmlFor={`${id}-r${item.key}-${field}`} className="field-label text-xs">
                        {label}
                      </label>
                      <input
                        id={`${id}-r${item.key}-${field}`}
                        className="input num px-2"
                        type="number"
                        inputMode={decimal ? "decimal" : "numeric"}
                        min={0}
                        step={decimal ? "0.1" : "1"}
                        value={item[field]}
                        onChange={(e) => updateItem(item.key, field, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <p className="num text-sm text-muted">
            Total: <span className="font-semibold text-ink">{Math.round(reviewTotal).toLocaleString()} kcal</span>
          </p>

          {mealField}

          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="btn-quiet" onClick={() => setReview(null)}>
              Don&apos;t add
            </button>
            <button type="submit" className="btn-primary" disabled={!reviewValid}>
              {review.items.length === 1 ? "Add to diary" : `Add ${review.items.length} items`}
            </button>
          </div>
          {!reviewValid && (
            <p className="text-xs text-muted">Every item needs a name and a calorie number.</p>
          )}
        </form>
      )}

      {mode === "manual" && (
        <form onSubmit={submitManual} className="space-y-3">
          <div>
            <label htmlFor={`${id}-name`} className="field-label">
              Food
            </label>
            <input
              id={`${id}-name`}
              className="input"
              placeholder="e.g. Nasi goreng"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${id}-kcal`} className="field-label">
                Calories (kcal)
              </label>
              <input
                id={`${id}-kcal`}
                className="input num"
                type="number"
                inputMode="numeric"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
            {mealField}
          </div>

          <details className="rounded-lg border border-line">
            <summary className="flex min-h-11 items-center px-3 text-sm font-medium text-muted hover:text-ink">
              Add macros (optional)
            </summary>
            <div className="grid grid-cols-3 gap-2 px-3 pb-3">
              {manualMacros.map(([key, label, value, setValue]) => (
                <div key={key}>
                  <label htmlFor={`${id}-${key}`} className="field-label text-xs">
                    {label}
                  </label>
                  <input
                    id={`${id}-${key}`}
                    className="input num"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              ))}
            </div>
          </details>

          <button type="submit" className="btn-primary w-full" disabled={!manualValid}>
            Add to diary
          </button>
          {!manualValid && (
            <p className="text-xs text-muted">Enter a food name and its calories to add it.</p>
          )}
        </form>
      )}
    </div>
  );
}
