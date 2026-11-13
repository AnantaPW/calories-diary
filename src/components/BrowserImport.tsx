"use client";

import { useState, useSyncExternalStore } from "react";
import { diaryStore } from "@/lib/client/diaryStore";
import { LEGACY_KEYS } from "@/lib/storage";
import { reloadTo } from "@/lib/client/navigate";

/*
 * Before accounts, the diary lived in this browser's localStorage. This
 * notice offers to move it into the signed-in account once.
 */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

const getRawEntries = () => read(LEGACY_KEYS.entries);
const getDismissed = () => read(LEGACY_KEYS.dismissed) === "1";
const getNull = () => null;
const getTrue = () => true;

function parse(raw: string | null): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function BrowserImport() {
  const rawEntries = useSyncExternalStore(subscribe, getRawEntries, getNull);
  const dismissed = useSyncExternalStore(subscribe, getDismissed, getTrue);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const entries = parse(rawEntries);
  const count = Array.isArray(entries) ? entries.length : 0;

  if (message) {
    return (
      <p role="status" className="card text-sm">
        {message}
      </p>
    );
  }
  if (dismissed || count === 0) return null;

  async function importAll() {
    setBusy(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          profile: parse(read(LEGACY_KEYS.profile)),
          targets: parse(read(LEGACY_KEYS.targets)),
        }),
      });
      if (response.status === 401) return reloadTo("/login");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(data?.error ? `Couldn't import: ${data.error}` : "Couldn't import. Try again later.");
        return;
      }
      for (const key of [LEGACY_KEYS.entries, LEGACY_KEYS.profile, LEGACY_KEYS.targets]) {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // storage blocked: nothing to clear
        }
      }
      const skipped = data.skipped > 0 ? ` ${data.skipped} were already there or couldn't be read.` : "";
      setMessage(`Added ${data.added} ${data.added === 1 ? "entry" : "entries"} to your account.${skipped}`);
      emit();
      await diaryStore.reload();
    } catch {
      setMessage("Couldn't reach the app. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  function leave() {
    try {
      window.localStorage.setItem(LEGACY_KEYS.dismissed, "1");
    } catch {
      // storage blocked: the notice comes back next time
    }
    emit();
  }

  return (
    <section className="card" aria-label="Diary saved in this browser">
      <p className="text-sm">
        This browser has <span className="num font-semibold">{count}</span> diary{" "}
        {count === 1 ? "entry" : "entries"} from before accounts.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={importAll}>
          {busy ? "Adding…" : "Add them to your account"}
        </button>
        <button type="button" className="btn-quiet" disabled={busy} onClick={leave}>
          Leave them
        </button>
      </div>
    </section>
  );
}
