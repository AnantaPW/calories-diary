"use client";

import { useEffect, useRef, useState } from "react";

const ROLL_MS = 700;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * `value`, counted from the last shown number to the new one over ROLL_MS
 * (jumps straight there under reduced motion). Starts at `from`.
 */
export function useRolledNumber(value: number, from: number = value): number {
  const [shown, setShown] = useState(from);
  const shownRef = useRef(from);

  useEffect(() => {
    const start = shownRef.current;
    if (start === value) return;
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ROLL_MS;
    const t0 = performance.now();
    let id = 0;
    const step = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - t0) / ms);
      shownRef.current = Math.round(start + (value - start) * easeOut(t));
      setShown(shownRef.current);
      if (t < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [value]);

  return shown;
}
