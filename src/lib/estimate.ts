/** Longest food description the AI input accepts. */
export const AI_INPUT_MAX = 52;

/** What the AI estimate fills into the food form. */
export interface FoodEstimate {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** The exact instruction sent to the model, with the user's text in place. */
export function buildEstimatePrompt(userInput: string): string {
  return `Only give output on a comma separated value of the name of the food (do aware that the input can containts multiple type of food or beverages), estimated kcal count, estimated protein, estimated carbs and estimated fat from ${userInput}`;
}

const toNumber = (field: string) => {
  const match = field.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** One reply line ("Nasi goreng, 650, 18, 80, 22") as an estimate, or null. */
function parseLine(line: string): FoodEstimate | null {
  const parts = line.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
  if (parts.length < 5) return null;

  const [calories, protein, carbs, fat] = parts.slice(-4).map(toNumber);
  const name = parts.slice(0, -4).join(", ").trim();
  // A header row such as "name, kcal, protein, carbs, fat" has no numbers: skip it.
  if (!name || ![calories, protein, carbs, fat].every(Number.isFinite)) return null;
  if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) return null;
  return { name, calories, protein, carbs, fat };
}

/** Most foods one description can turn into. */
export const AI_MAX_ITEMS = 8;

/**
 * Reads the model's reply into estimates, one per food or drink (the model
 * answers with one line per item). Each becomes its own diary entry.
 * Returns null when no line is a usable name + four numbers, or when nothing
 * has any calories, so a chatty or malformed answer never reaches the diary.
 */
export function parseEstimates(reply: string): FoodEstimate[] | null {
  const items = reply
    .replace(/```[a-z]*/gi, "")
    .split(/\r?\n/)
    .map((l) => parseLine(l.trim()))
    .filter((item): item is FoodEstimate => item !== null && item.calories <= 10000)
    .slice(0, AI_MAX_ITEMS)
    .map((item) => ({
      name: item.name.slice(0, 80),
      calories: Math.round(item.calories),
      protein: round1(item.protein),
      carbs: round1(item.carbs),
      fat: round1(item.fat),
    }));

  if (items.length === 0 || items.every((item) => item.calories === 0)) return null;
  return items;
}
