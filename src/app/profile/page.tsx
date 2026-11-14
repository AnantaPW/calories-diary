"use client";

import { useId, useState, type FormEvent } from "react";
import AccountSection from "@/components/AccountSection";
import StorageError from "@/components/StorageError";
import TargetCard from "@/components/TargetCard";
import ThemePicker from "@/components/ThemePicker";
import { useAccount, useProfile } from "@/hooks/useDiary";
import { ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/calories";
import type { ActivityLevel, Goal, Sex, UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const heading = (
  <div>
    <h1 className="type-title">Profile and settings</h1>
    <p className="text-sm text-muted-foreground">
      Your details set your daily target (Mifflin–St Jeor).
    </p>
  </div>
);

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
    <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
      {/* On phones the target comes first: it is what the form below changes. */}
      <div className="lg:order-2">
        <TargetCard draft={draft} unsaved={dirty} />
      </div>

      <form onSubmit={handleSubmit} className="lg:order-1" aria-label="Body details and goal">
        <FieldSet>
          <FieldLegend className="type-section">Body and goal</FieldLegend>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`${id}-sex`}>Sex</FieldLabel>
              <NativeSelect id={`${id}-sex`} className="w-full" value={draft.sex} onChange={(e) => update("sex", e.target.value as Sex)}>
                <NativeSelectOption value="female">Female</NativeSelectOption>
                <NativeSelectOption value="male">Male</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-age`}>Age</FieldLabel>
              <Input id={`${id}-age`} className="tabular-nums" type="number" inputMode="numeric" min={13} max={120} required value={draft.age} onChange={(e) => update("age", Number(e.target.value))} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-height`}>Height (cm)</FieldLabel>
              <Input id={`${id}-height`} className="tabular-nums" type="number" inputMode="numeric" min={100} max={250} required value={draft.heightCm} onChange={(e) => update("heightCm", Number(e.target.value))} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-weight`}>Weight (kg)</FieldLabel>
              <Input id={`${id}-weight`} className="tabular-nums" type="number" inputMode="decimal" min={30} max={350} step="0.1" required value={draft.weightKg} onChange={(e) => update("weightKg", Number(e.target.value))} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor={`${id}-activity`}>Activity level</FieldLabel>
              <NativeSelect id={`${id}-activity`} className="w-full" value={draft.activity} onChange={(e) => update("activity", e.target.value as ActivityLevel)}>
                {Object.entries(ACTIVITY_LABELS).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-goal`}>Goal</FieldLabel>
              <NativeSelect id={`${id}-goal`} className="w-full" value={draft.goal} onChange={(e) => update("goal", e.target.value as Goal)}>
                {Object.entries(GOAL_LABELS).map(([value, label]) => (
                  <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${id}-custom`}>Custom target (optional)</FieldLabel>
              <Input
                id={`${id}-custom`}
                className="tabular-nums"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="kcal per day"
                value={draft.customTarget ?? ""}
                onChange={(e) => update("customTarget", e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full sm:w-auto" disabled={!dirty}>
                {!dirty && savedOnce ? "Saved" : "Save profile"}
              </Button>
              <p className="sr-only" role="status">
                {!dirty && savedOnce ? "Profile saved" : ""}
              </p>
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, setProfile, loaded, error } = useProfile();
  const { username, isAdmin, theme, setTheme } = useAccount();

  return (
    <div className="flex flex-col gap-6">
      {heading}
      {error ? (
        <StorageError />
      ) : !loaded ? (
        <Skeleton className="h-64 rounded-2xl" role="status" aria-label="Loading your profile" />
      ) : (
        <>
          <ProfileForm profile={profile} onSave={setProfile} />
          <Separator />
          <ThemePicker saved={theme} onSave={setTheme} />
          {username && (
            <>
              <Separator />
              <AccountSection username={username} isAdmin={isAdmin} />
            </>
          )}
        </>
      )}
    </div>
  );
}
