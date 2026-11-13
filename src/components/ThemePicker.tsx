"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ACCENTS, type Accent } from "@/lib/theme";

interface Props {
  saved: Accent;
  onSave: (accent: Accent) => void;
}

function setPageAccent(accent: Accent) {
  document.documentElement.dataset.accent = accent;
}

/**
 * Theme colour choice. Picking a swatch previews it across the page right
 * away; leaving without saving puts the saved colour back.
 */
export default function ThemePicker({ saved, onSave }: Props) {
  const id = useId();
  const [choice, setChoice] = useState<Accent>(saved);
  const [justSaved, setJustSaved] = useState(false);
  const savedRef = useRef(saved);

  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);

  // Leaving the page undoes an unsaved preview.
  useEffect(() => () => setPageAccent(savedRef.current), []);

  function pick(accent: Accent) {
    setChoice(accent);
    setJustSaved(false);
    setPageAccent(accent);
  }

  const dirty = choice !== saved;

  return (
    <section className="border-t border-line pt-6" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">
        Theme colour
      </h2>
      <p className="mt-1 text-sm text-muted">
        Changes the plates, buttons and links. Amber still means over target in every theme.
      </p>

      <fieldset className="mt-4">
        <legend className="sr-only">Theme colour</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACCENTS.map((a) => (
            <label key={a.value} className="relative block">
              <input
                type="radio"
                name={`${id}-accent`}
                value={a.value}
                checked={choice === a.value}
                onChange={() => pick(a.value)}
                className="peer sr-only"
              />
              <span className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2 text-sm hover:border-muted peer-checked:border-ink peer-checked:bg-surface-2 peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
                {/* A small plate in this colour: what the theme will look like. */}
                <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 -rotate-90" aria-hidden="true">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--color-line)" strokeWidth="5" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={a.color}
                    strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 14 * 0.68} ${2 * Math.PI * 14}`}
                  />
                  {choice === a.value && (
                    <path
                      d="m12.5 18.5 4 4 7-7"
                      transform="rotate(90 18 18)"
                      fill="none"
                      stroke="var(--color-ink)"
                      strokeWidth="2.5"
                      strokeLinecap="square"
                    />
                  )}
                </svg>
                {a.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={!dirty}
          onClick={() => {
            onSave(choice);
            setJustSaved(true);
          }}
        >
          {justSaved && !dirty ? "Saved" : "Save colour"}
        </button>
        {dirty && <span className="text-sm text-muted">Previewing. Save to keep it.</span>}
      </div>
    </section>
  );
}
