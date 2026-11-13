"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { reloadTo } from "@/lib/client/navigate";
import Wordmark from "@/components/Wordmark";
import {
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  passwordProblem,
  usernameProblem,
} from "@/lib/userData";

type Mode = "login" | "signup";
type Field = "username" | "password" | "confirm";

interface Props {
  mode: Mode;
  /** Sign-up can be switched off with ALLOW_SIGNUP=false. */
  signupAllowed: boolean;
}

export default function AuthForm({ mode, signupAllowed }: Props) {
  const id = useId();
  const signup = mode === "signup";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  function fail(message: string, field?: Field) {
    setFormError(message);
    setFieldErrors(field ? { [field]: message } : {});
    // Move focus to the summary so screen readers hear what went wrong.
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const name = username.trim();

    if (signup) {
      const u = usernameProblem(name);
      if (u) return fail(u, "username");
      const p = passwordProblem(password, name);
      if (p) return fail(p, "password");
      if (confirm !== password) return fail("The two passwords don't match.", "confirm");
    } else if (!name || !password) {
      return fail("Enter your username and password.", !name ? "username" : "password");
    }

    setBusy(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const response = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, password }),
      });
      if (response.ok) {
        // A full load so the layout picks up the account's theme colour.
        reloadTo("/");
        return;
      }
      const data = await response.json().catch(() => null);
      fail(data?.error ?? "Something went wrong. Try again.", data?.field);
    } catch {
      fail("Couldn't reach the app. Check your connection and try again.");
    }
    setBusy(false);
  }

  const describedBy = (field: Field, help?: string) =>
    [fieldErrors[field] ? `${id}-${field}-error` : "", help ?? ""].filter(Boolean).join(" ") ||
    undefined;

  const fieldError = (field: Field) =>
    fieldErrors[field] && (
      <p id={`${id}-${field}-error`} className="mt-1 text-sm text-over">
        {fieldErrors[field]}
      </p>
    );

  return (
    <div className="mx-auto w-full max-w-sm">
      <Wordmark />

      <div className="card space-y-4">
        <h1 className="title">{signup ? "Create account" : "Log in"}</h1>

        <div ref={summaryRef} tabIndex={-1} role="alert" className="outline-none">
          {formError && (
            <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-over">
              {formError}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor={`${id}-username`} className="field-label">
              Username
            </label>
            <input
              id={`${id}-username`}
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={USERNAME_MAX}
              aria-invalid={!!fieldErrors.username}
              aria-describedby={describedBy("username", signup ? `${id}-username-help` : undefined)}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {signup && (
              <p id={`${id}-username-help`} className="mt-1 text-xs text-muted">
                {USERNAME_MIN} to {USERNAME_MAX} characters: letters, numbers, _ and -.
              </p>
            )}
            {fieldError("username")}
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`${id}-password`} className="field-label">
                Password
              </label>
              <button
                type="button"
                className="min-h-11 px-1 text-sm font-medium text-brand hover:underline"
                aria-pressed={showPassword}
                aria-controls={`${id}-password`}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id={`${id}-password`}
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              aria-invalid={!!fieldErrors.password}
              aria-describedby={describedBy("password", signup ? `${id}-password-help` : undefined)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {signup && (
              <p id={`${id}-password-help`} className="num mt-1 text-xs text-muted">
                At least {PASSWORD_MIN} characters ({Math.min(password.length, PASSWORD_MIN)} of{" "}
                {PASSWORD_MIN}). A longer phrase is stronger than symbols.
              </p>
            )}
            {fieldError("password")}
          </div>

          {signup && (
            <div>
              <label htmlFor={`${id}-confirm`} className="field-label">
                Confirm password
              </label>
              <input
                id={`${id}-confirm`}
                className="input"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.confirm}
                aria-describedby={describedBy("confirm")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {fieldError("confirm")}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {signup ? (busy ? "Creating account…" : "Create account") : busy ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        {signup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="link inline-flex min-h-11 items-center">
              Log in
            </Link>
          </>
        ) : signupAllowed ? (
          <>
            No account yet?{" "}
            <Link href="/signup" className="link inline-flex min-h-11 items-center">
              Create account
            </Link>
          </>
        ) : (
          "New accounts are added by whoever runs this app."
        )}
      </p>
    </div>
  );
}
