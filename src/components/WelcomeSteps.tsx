"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import StorageError from "@/components/StorageError";
import TargetCard from "@/components/TargetCard";
import ThemePicker from "@/components/ThemePicker";
import { useAccount, useProfile } from "@/hooks/useDiary";
import { ACTIVITY_LABELS } from "@/lib/calories";
import type { Theme } from "@/lib/theme";
import type { ActivityLevel, Goal, Sex } from "@/lib/types";
import {
  EMPTY_DRAFT,
  WELCOME_STEPS,
  draftToProfile,
  stepProblems,
  type WelcomeDraft,
  type WelcomeField,
} from "@/lib/welcome";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const GOALS: { value: Goal; title: string; hint: string }[] = [
  { value: "lose", title: "Lose weight", hint: "500 kcal under what you burn, about 0.5 kg a week." },
  { value: "maintain", title: "Stay where I am", hint: "Eat what you burn." },
  { value: "gain", title: "Gain weight", hint: "300 kcal over what you burn." },
];

const SEXES: { value: Sex; title: string }[] = [
  { value: "female", title: "Female" },
  { value: "male", title: "Male" },
];

const HEADINGS: Record<number, { title: string; lead: string }> = {
  1: { title: "What are you aiming for?", lead: "Sets your target below, at or above what you burn." },
  2: { title: "A few body details", lead: "Used to estimate what your body burns at rest." },
  3: { title: "How active is a normal week?", lead: "Pick the closest. You can change it later." },
  4: { title: "Your daily target", lead: "Today counts against this number. Nothing is saved until you press Save." },
};

/** Big tappable rows, the same shape as the theme choices in Profile. */
function Choices<T extends string>({
  name,
  labelledBy,
  value,
  options,
  error,
  onChange,
  columns = "",
}: {
  name: string;
  labelledBy: string;
  value: T | null;
  options: { value: T; title: string; hint?: string }[];
  error?: string;
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        id={name}
        aria-labelledby={labelledBy}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={!!error || undefined}
        className={cn("grid gap-2", columns)}
        value={value}
        onValueChange={(v) => onChange(v as T)}
      >
        {options.map((o) => (
          <FieldLabel key={o.value} htmlFor={`${name}-${o.value}`} className="transition-ui active:translate-y-px">
            <Field orientation="horizontal" className="items-center gap-3 p-4!">
              <FieldContent>
                <FieldTitle id={`${name}-${o.value}-title`}>{o.title}</FieldTitle>
                {o.hint && <FieldDescription id={`${name}-${o.value}-hint`}>{o.hint}</FieldDescription>}
              </FieldContent>
              {/* The radio is a span; the label's htmlFor reaches only Base UI's hidden input, so name it directly. */}
              <RadioGroupItem
                value={o.value}
                id={`${name}-${o.value}`}
                aria-labelledby={`${name}-${o.value}-title`}
                aria-describedby={o.hint ? `${name}-${o.value}-hint` : undefined}
                aria-invalid={!!error || undefined}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  error,
  onChange,
  decimal,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  decimal?: boolean;
  placeholder?: string;
}) {
  return (
    <Field data-invalid={!!error || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        className="tabular-nums"
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        step={decimal ? "0.1" : "1"}
        placeholder={placeholder}
        value={value}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}

export default function WelcomeSteps() {
  const id = useId();
  const router = useRouter();
  const { setProfile, loaded, error: loadError } = useProfile();
  const { theme, setTheme } = useAccount();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [draft, setDraft] = useState<WelcomeDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<WelcomeField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [pickedTheme, setPickedTheme] = useState<Theme | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // After Next or Back, keyboard and screen-reader users land on the new question.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus();
  }, [step]);

  const update = <K extends WelcomeField>(key: K, value: WelcomeDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  function go(to: number) {
    moved.current = true;
    setDirection(to > step ? "next" : "back");
    setErrors({});
    setStep(to);
  }

  /** Shows what's missing on this step and puts focus on the first problem. */
  function blocked(): boolean {
    const problems = stepProblems(step, draft);
    const first = Object.keys(problems)[0] as WelcomeField | undefined;
    setErrors(problems);
    if (!first) return false;
    // A choice group's id is on its wrapper; focus its first radio instead.
    const el = document.getElementById(`${id}-${first}`);
    (el?.querySelector<HTMLElement>('[role="radio"]') ?? el)?.focus();
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (blocked()) return;
    if (step < WELCOME_STEPS) return go(step + 1);
    const profile = draftToProfile(draft);
    if (!profile) return go(1);
    setSaving(true);
    // Theme first, so the picker's unmount doesn't undo the preview. A failed save shows a toast
    // and reloads; Today then still offers setup.
    if (pickedTheme && (pickedTheme.accent !== theme.accent || pickedTheme.mode !== theme.mode)) {
      void setTheme(pickedTheme);
    }
    await setProfile(profile);
    router.push("/");
  }

  const heading = HEADINGS[step];
  const profile = draftToProfile(draft);

  let body: ReactNode = null;
  if (step === 1) {
    body = (
      <Choices
        name={`${id}-goal`}
        labelledBy={`${id}-heading`}
        value={draft.goal}
        options={GOALS}
        error={errors.goal}
        onChange={(v) => update("goal", v)}
      />
    );
  } else if (step === 2) {
    body = (
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <p id={`${id}-sex-label`} className="text-sm font-medium">
            Sex (changes the formula)
          </p>
          <Choices
            name={`${id}-sex`}
            labelledBy={`${id}-sex-label`}
            value={draft.sex}
            options={SEXES}
            error={errors.sex}
            onChange={(v) => update("sex", v)}
            columns="grid-cols-2"
          />
        </div>
        <NumberField id={`${id}-age`} label="Age" value={draft.age} error={errors.age} onChange={(v) => update("age", v)} />
        <NumberField id={`${id}-heightCm`} label="Height (cm)" value={draft.heightCm} error={errors.heightCm} onChange={(v) => update("heightCm", v)} />
        <NumberField id={`${id}-weightKg`} label="Weight (kg)" value={draft.weightKg} error={errors.weightKg} onChange={(v) => update("weightKg", v)} decimal />
      </FieldGroup>
    );
  } else if (step === 3) {
    body = (
      <Choices
        name={`${id}-activity`}
        labelledBy={`${id}-heading`}
        value={draft.activity}
        options={Object.entries(ACTIVITY_LABELS).map(([value, title]) => ({ value: value as ActivityLevel, title }))}
        error={errors.activity}
        onChange={(v) => update("activity", v)}
      />
    );
  } else if (profile) {
    body = (
      <div className="flex flex-col gap-6">
        <TargetCard
          draft={{ ...profile, customTarget: Number(draft.customTarget) > 0 ? Number(draft.customTarget) : undefined }}
          unsaved={false}
        />
        <div className="max-w-xs">
          <NumberField
            id={`${id}-customTarget`}
            label="Custom target (optional)"
            placeholder="kcal per day"
            value={draft.customTarget}
            error={errors.customTarget}
            onChange={(v) => update("customTarget", v)}
          />
        </div>
      </div>
    );
  }

  const prevLabel = step > 1 ? "Back" : null;
  const nextLabel = ["", "Next: body", "Next: activity", "See my target", "Save target"][step];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums" aria-live="polite">
          Step {step} of {WELCOME_STEPS}
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }), "-mr-3")}>
          Skip for now
        </Link>
      </div>

      {/* Keyed by step so each question slides in from the side it came from. */}
      <div key={step} className="step-in flex flex-col gap-6" data-dir={direction}>
        <form id={`${id}-form`} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-labelledby={`${id}-heading`}>
          <div className="flex flex-col gap-1">
            <h1 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className="type-title outline-none">
              {heading.title}
            </h1>
            <p className="text-sm text-muted-foreground">{heading.lead}</p>
          </div>
          {body}
        </form>

        {/* Outside the form: the theme picker has its own Save button. */}
        {step === WELCOME_STEPS && (
          <>
            <Separator />
            {loadError ? <StorageError /> : loaded && <ThemePicker saved={theme} onPick={setPickedTheme} />}
            <Separator />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {prevLabel && (
          <Button type="button" variant="outline" disabled={saving} onClick={() => go(step - 1)}>
            {prevLabel}
          </Button>
        )}
        <Button
          type="submit"
          form={`${id}-form`}
          className="flex-1 sm:flex-none"
          disabled={saving || (step === WELCOME_STEPS && !loaded)}
        >
          {saving && <Spinner data-icon="inline-start" />}
          {saving ? "Saving…" : nextLabel}
        </Button>
      </div>
    </div>
  );
}
