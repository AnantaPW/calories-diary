import {
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENT,
  GOAL_LABELS,
  MIN_TARGET,
  calculateBMR,
  calculateDailyTarget,
  calculateTDEE,
} from "@/lib/calories";
import type { UserProfile } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/** Explains in plain numbers where the target comes from. */
export default function TargetCard({ draft, unsaved }: { draft: UserProfile; unsaved: boolean }) {
  const bmr = calculateBMR(draft);
  const tdee = calculateTDEE(draft);
  const target = calculateDailyTarget(draft);
  const adjustment = GOAL_ADJUSTMENT[draft.goal];
  const calculated = tdee + adjustment;
  const custom = !!draft.customTarget && draft.customTarget > 0;
  const floored = !custom && calculated < MIN_TARGET[draft.sex];

  return (
    <Card variant="plate" role="region" aria-label="Daily target">
      <CardHeader>
        <CardDescription>Daily target</CardDescription>
        <p className="type-focal">
          {target.toLocaleString()}
          <span className="ml-2 font-sans text-base font-medium text-muted-foreground">kcal</span>
        </p>
        {unsaved && <p className="text-sm text-over">Not saved yet.</p>}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 text-sm">
      <Separator />
      <dl className="flex flex-col gap-2 tabular-nums">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">BMR (energy at rest)</dt>
          <dd>{bmr.toLocaleString()} kcal</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">× activity {ACTIVITY_MULTIPLIERS[draft.activity]} = TDEE</dt>
          <dd>{tdee.toLocaleString()} kcal</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{GOAL_LABELS[draft.goal]}</dt>
          <dd>
            {adjustment === 0 ? "no change" : `${adjustment > 0 ? "+" : "−"}${Math.abs(adjustment)} kcal`}
          </dd>
        </div>
      </dl>
      {custom && (
        <p className="text-muted-foreground">
          Using your custom target. Calculated: {Math.max(MIN_TARGET[draft.sex], calculated).toLocaleString()} kcal.
        </p>
      )}
      {floored && (
        <p className="text-muted-foreground">
          Raised from {calculated.toLocaleString()} to the {MIN_TARGET[draft.sex].toLocaleString()} kcal minimum.
        </p>
      )}
      </CardContent>
    </Card>
  );
}
