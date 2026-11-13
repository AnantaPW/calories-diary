"use client";

import { useEffect, useSyncExternalStore } from "react";
import { dismissToast, uiStore } from "@/lib/client/uiStore";

const VISIBLE_MS = 6000;

/**
 * The app's one toast, above the bottom nav: "Added…", "Removed… Undo",
 * and save errors all use it, so messages never stack.
 */
export default function Toast() {
  const { toast } = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot, uiStore.getServerSnapshot);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(dismissToast, VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 sm:bottom-6"
    >
      {toast && (
        <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl border border-line bg-surface-2 py-1 pl-4 pr-1 text-sm">
          <span className="min-w-0 break-words py-2.5">{toast.text}</span>
          {toast.action ? (
            <button
              type="button"
              className="min-h-11 shrink-0 rounded-[10px] px-3 font-semibold text-brand hover:bg-surface active:translate-y-px"
              onClick={() => {
                toast.action?.run();
                dismissToast();
              }}
            >
              {toast.action.label}
            </button>
          ) : (
            <span className="w-3" />
          )}
        </div>
      )}
    </div>
  );
}
