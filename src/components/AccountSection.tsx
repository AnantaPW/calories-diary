"use client";

import { useId, useState, type FormEvent } from "react";
import { passwordProblem } from "@/lib/userData";
import { reloadTo } from "@/lib/client/navigate";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type PwField = "current" | "next" | "confirm";

/** Who is signed in, change password, and log out. */
export default function AccountSection({ username }: { username: string }) {
  const id = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: PwField; text: string } | null>(null);
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

  const passwordField = (field: PwField, label: string, value: string, set: (v: string) => void, autoComplete: string) => (
    <Field data-invalid={error?.field === field || undefined}>
      <FieldLabel htmlFor={`${id}-${field}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${field}`}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={error?.field === field || undefined}
        aria-describedby={error?.field === field ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </Field>
  );

  return (
    <section className="flex flex-col gap-4" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="type-section">
            Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Logged in as <span className="font-medium text-foreground">{username}</span>
          </p>
        </div>
        <Button variant="outline" disabled={loggingOut} onClick={logOut}>
          {loggingOut && <Spinner data-icon="inline-start" />}
          {loggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>

      <Separator />

      <form onSubmit={changePassword} noValidate>
        <FieldSet>
          <FieldLegend variant="label">Change password</FieldLegend>
          <FieldGroup className="gap-4">
            {passwordField("current", "Current password", current, setCurrent, "current-password")}
            <div className="grid gap-4 sm:grid-cols-2">
              {passwordField("next", "New password", next, setNext, "new-password")}
              {passwordField("confirm", "Confirm new password", confirm, setConfirm, "new-password")}
            </div>
            <FieldDescription className="text-xs">
              At least 8 characters. Changing it logs you out everywhere else.
            </FieldDescription>
            <div className="flex flex-col items-start gap-3">
              {/* Both live regions stay mounted so screen readers hear the message. */}
              <div>
                <div role="alert">{error && <FieldError id={`${id}-error`} role="none">{error.text}</FieldError>}</div>
                <div role="status">
                  {done && <p className="text-sm text-primary">Password changed. Other devices are logged out.</p>}
                </div>
              </div>
              <Button type="submit" disabled={busy}>
                {busy && <Spinner data-icon="inline-start" />}
                {busy ? "Changing…" : "Change password"}
              </Button>
            </div>
          </FieldGroup>
        </FieldSet>
      </form>
    </section>
  );
}
