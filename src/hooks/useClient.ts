"use client";

import { useCallback, useSyncExternalStore } from "react";
import { toDateKey } from "@/lib/date";

const noSubscribe = () => () => {};
const getToday = () => toDateKey();
const getNull = () => null;
const getFalse = () => false;

/**
 * Today's date key, or null while the page is still server-rendered HTML.
 * "Today" depends on the visitor's clock, so it must not be baked into the
 * pre-rendered page.
 */
export function useToday(): string | null {
  return useSyncExternalStore(noSubscribe, getToday, getNull);
}

/** True when the viewport matches the CSS media query (false before hydration). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (listener: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getFalse);
}
