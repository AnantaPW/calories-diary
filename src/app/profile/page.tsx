"use client";

import { useId, useState, type FormEvent } from "react";
import AccountSection from "@/components/AccountSection";
import StorageError from "@/components/StorageError";
import ThemePicker from "@/components/ThemePicker";
import { useAccount, useProfile } from "@/hooks/useDiary";
import {
  ACTIVITY_LABELS,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENT,
  GOAL_LABELS,
  MIN_TARGET,
  calculateBMR,
  calculateDailyTarget,
  calculateTDEE,
} from "@/lib/calories";
import type { ActivityLevel, Goal, Sex, UserProfile } from "@/lib/types";

const heading = (
  <div>
    <h1 className="title">Profile and settings</h1>
    <p className="text-sm text-muted">
      Your body details set the daily calorie target (Mifflin–St Jeor equation).
    </p>
  </div>
);

/** Explains in plain numbers where the target comes from. */
function TargetCard({ draft, unsaved }: { draft: UserProfile; unsaved: boolean }) {
  const bmr = calculateBMR(draft);
  const tdee = calculateTDEE(draft);
  const target = calculateDailyTarget(draft);
  const adjustment = GOAL_ADJUSTMENT[draft.goal];
  const calculated = tdee + adjustment;
  const custom = !!draft.customTarget && draft.customTarget > 0;
  const floored = !custom && calculated < MIN_TARGET[draft.sex];

  return (
    <section className="card-focal" aria-label="Daily target">
      <p className="text-sm text-muted">Daily target</p>
      <p className="focal-number mt-1 text-[clamp(3rem,2.4rem+3vw,4rem)]">
        {target.toLocaleString()}
        <span className="ml-2 text-base font-medium text-muted">kcal</span>
      </p>
      {unsaved && <p className="mt-1 text-sm text-over">Not saved yet. Save to use this target.</p>}

      <dl className="num mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">BMR (energy at rest)</dt>
          <dd>{bmr.toLocaleString()} kcal</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">× activity {ACTIVITY_MULTIPLIERS[draft.activity]} = TDEE</dt>
          <dd>{tdee.toLocaleString()} kcal</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">{GOAL_LABELS[draft.goal]}</dt>
          <dd>
            {adjustment === 0 ? "no change" : `${adjustment > 0 ? "+" : "−"}${Math.abs(adjustment)} kcal`}
          </dd>
        </div>
      </dl>
      {custom && (
        <p className="mt-3 text-sm text-muted">
          You set a custom target. The calculated one would be{" "}
          {Math.max(MIN_TARGET[draft.sex], calculated).toLocaleString()} kcal.
        </p>
      )}
      {floored && (
        <p className="mt-3 text-sm text-muted">
          The sum comes to {calculated.toLocaleString()} kcal, so the target is raised to the{" "}
          {MIN_TARGET[draft.sex].toLocaleString()} kcal minimum.
        </p>
      )}
    </section>
  );
}

function ProfileForm({
  profile,
  onSave,
}: {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [savedOnce, setSavedOnce] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSave(draft);
    setSavedOnce(true);
  }

  return (
    <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6 lg:space-y-0">
      {/* On phones the target comes first: it is what the form below changes. */}
      <div className="lg:order-2">
        <TargetCard draft={draft} unsaved={dirty} />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:order-1" aria-label="Body details and goal">
        <h2 className="section-title sm:col-span-2">Body and goal</h2>
        <div>
          <label htmlFor={`${id}-sex`} className="field-label">Sex</label>
          <select id={`${id}-sex`} className="input" value={draft.sex} onChange={(e) => update("sex", e.target.value as Sex)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-age`} className="field-label">Age</label>
          <input id={`${id}-age`} className="input num" type="number" inputMode="numeric" min={13} max={120} required value={draft.age} onChange={(e) => update("age", Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor={`${id}-height`} className="field-label">Height (cm)</label>
          <input id={`${id}-height`} className="input num" type="number" inputMode="numeric" min={100} max={250} required value={draft.heightCm} onChange={(e) => update("heightCm", Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor={`${id}-weight`} className="field-label">Weight (kg)</label>
          <input id={`${id}-weight`} className="input num" type="number" inputMode="decimal" min={30} max={350} step="0.1" required value={draft.weightKg} onChange={(e) => update("weightKg", Number(e.target.value))} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${id}-activity`} className="field-label">Activity level</label>
          <select id={`${id}-activity`} className="input" value={draft.activity} onChange={(e) => update("activity", e.target.value as ActivityLevel)}>
            {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-goal`} className="field-label">Goal</label>
          <select id={`${id}-goal`} className="input" value={draft.goal} onChange={(e) => update("goal", e.target.value as Goal)}>
            {Object.entries(GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`${id}-custom`} className="field-label">Custom target (optional)</label>
          <input
            id={`${id}-custom`}
            className="input num"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="kcal per day"
            value={draft.customTarget ?? ""}
            onChange={(e) => update("customTarget", e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!dirty}>
            {!dirty && savedOnce ? "Saved" : "Save profile"}
          </button>
          <p className="sr-only" role="status">
            {!dirty && savedOnce ? "Profile saved" : ""}
          </p>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, setProfile, loaded, error } = useProfile();
  const { username, accent, setAccent } = useAccount();

  return (
    <div className="space-y-5">
      {heading}
      {error ? (
        <StorageError />
      ) : !loaded ? (
        <p className="card-focal flex min-h-56 items-center justify-center text-sm text-muted" role="status">
          Loading your profile…
        </p>
      ) : (
        <>
          <ProfileForm profile={profile} onSave={setProfile} />
          <ThemePicker saved={accent} onSave={setAccent} />
          {username && <AccountSection username={username} />}
        </>
      )}
    </div>
  );
}
