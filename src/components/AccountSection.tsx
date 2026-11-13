"use client";

import { useId, useState, type FormEvent } from "react";
import { passwordProblem } from "@/lib/userData";
import { reloadTo } from "@/lib/client/navigate";

type Field = "current" | "next" | "confirm";

/** Who is signed in, change password, and log out. */
export default function AccountSection({ username }: { username: string }) {
  const id = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: Field; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setDone(false);
    if (!current) return setError({ field: "current", text: "Enter your current password." });
    const problem = passwordProblem(next, username);
    if (problem) return setError({ field: "next", text: problem });
    if (confirm !== next) return setError({ field: "confirm", text: "The two new passwords don't match." });

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (response.status === 401) return reloadTo("/login");
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError({ field: data?.field, text: data?.error ?? "Couldn't change the password. Try again." });
      } else {
        setCurrent("");
        setNext("");
        setConfirm("");
        setDone(true);
      }
    } catch {
      setError({ text: "Couldn't reach the app. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  async function logOut() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      reloadTo("/login");
    }
  }

  const passwordField = (field: Field, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <div>
      <label htmlFor={`${id}-${field}`} className="field-label">
        {label}
      </label>
      <input
        id={`${id}-${field}`}
        className="input"
        type="password"
        autoComplete={autoComplete}
        aria-invalid={error?.field === field}
        aria-describedby={error?.field === field ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </div>
  );

  return (
    <section className="border-t border-line pt-6" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="section-title">
            Account
          </h2>
          <p className="text-sm text-muted">
            Logged in as <span className="font-medium text-ink">{username}</span>
          </p>
        </div>
        <button type="button" className="btn-quiet" disabled={loggingOut} onClick={logOut}>
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>

      <form onSubmit={changePassword} noValidate className="mt-4 space-y-3 border-t border-line pt-4">
        <h3 className="text-sm font-semibold">Change password</h3>
        {passwordField("current", "Current password", current, setCurrent, "current-password")}
        <div className="grid gap-3 sm:grid-cols-2">
          {passwordField("next", "New password", next, setNext, "new-password")}
          {passwordField("confirm", "Confirm new password", confirm, setConfirm, "new-password")}
        </div>
        <p className="text-xs text-muted">
          At least 8 characters. Changing it logs you out everywhere else.
        </p>
        <div role="alert">
          {error && (
            <p id={`${id}-error`} className="text-sm text-over">
              {error.text}
            </p>
          )}
        </div>
        <div role="status">
          {done && <p className="text-sm text-brand">Password changed. Other devices are logged out.</p>}
        </div>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Changing…" : "Change password"}
        </button>
      </form>
    </section>
  );
}
