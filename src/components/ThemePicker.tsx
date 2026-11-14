"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ACCENTS, MODES, type Accent, type Mode, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Props {
  saved: Theme;
  onSave?: (theme: Theme) => void;
  /** First-run setup: no Save button here; the page saves the pick with everything else. */
  onPick?: (theme: Theme) => void;
}

function setPageTheme({ accent, mode }: Theme) {
  document.documentElement.dataset.accent = accent;
  document.documentElement.dataset.mode = mode;
}

/**
 * Light or dark, and the theme colour. Picking either previews it across the
 * page right away; leaving without saving puts the saved theme back.
 */
export default function ThemePicker({ saved, onSave, onPick }: Props) {
  const id = useId();
  const [choice, setChoice] = useState<Theme>(saved);
  const [justSaved, setJustSaved] = useState(false);
  const savedRef = useRef(saved);

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  // Leaving the page undoes an unsaved preview.
  useEffect(() => () => setPageTheme(savedRef.current), []);

  function pick(next: Partial<Theme>) {
    const theme = { ...choice, ...next };
    setChoice(theme);
    setJustSaved(false);
    setPageTheme(theme);
    onPick?.(theme);
  }

  const dirty = choice.accent !== saved.accent || choice.mode !== saved.mode;

  return (
    <section className="flex flex-col gap-5" aria-labelledby={`${id}-title`}>
      <div>
        <h2 id={`${id}-title`} className="type-section">
          {onPick ? "Theme (optional)" : "Theme"}
        </h2>
        <p className="text-sm text-muted-foreground">
          Amber always means over target.
          {onPick && " You can change this later in Profile."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 id={`${id}-mode`} className="text-sm font-medium">
          Light or dark
        </h3>
        <RadioGroup
          aria-labelledby={`${id}-mode`}
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          value={choice.mode}
          onValueChange={(value) => pick({ mode: value as Mode })}
        >
          {MODES.map((m) => (
            <FieldLabel key={m.value} htmlFor={`${id}-mode-${m.value}`} className="transition-ui active:translate-y-px">
              <Field orientation="horizontal" className="items-center gap-3 p-3!">
                <FieldContent>
                  <FieldTitle id={`${id}-mode-${m.value}-title`}>{m.label}</FieldTitle>
                  <FieldDescription>{m.hint}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={m.value} id={`${id}-mode-${m.value}`} aria-labelledby={`${id}-mode-${m.value}-title`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <h3 id={`${id}-colour`} className="text-sm font-medium">
          Colour
        </h3>
        <RadioGroup
          aria-labelledby={`${id}-colour`}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          value={choice.accent}
          onValueChange={(value) => pick({ accent: value as Accent })}
        >
          {ACCENTS.map((a) => (
            <FieldLabel key={a.value} htmlFor={`${id}-${a.value}`} className="transition-ui active:translate-y-px">
              <Field orientation="horizontal" className="items-center gap-3 p-3!">
                {/* A small plate in this colour, as it looks in the current mode. */}
                <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border)" strokeWidth="5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    style={{ stroke: `light-dark(${a.light}, ${a.color})` }}
                    strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 14 * 0.68} ${2 * Math.PI * 14}`}
                  />
                </svg>
                <FieldContent>
                  <FieldTitle id={`${id}-${a.value}-title`}>{a.label}</FieldTitle>
                </FieldContent>
                <RadioGroupItem value={a.value} id={`${id}-${a.value}`} aria-labelledby={`${id}-${a.value}-title`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </div>

      {onSave && (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            disabled={!dirty}
            onClick={() => {
              onSave(choice);
              setJustSaved(true);
            }}
          >
            {justSaved && !dirty ? "Saved" : "Save theme"}
          </Button>
          {dirty && <span className="text-sm text-muted-foreground">Previewing. Save to keep it.</span>}
        </div>
      )}
    </section>
  );
}
