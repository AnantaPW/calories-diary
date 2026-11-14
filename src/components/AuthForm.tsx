"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { reloadTo } from "@/lib/client/navigate";
import Wordmark from "@/components/Wordmark";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import {
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  passwordProblem,
  usernameProblem,
} from "@/lib/userData";

type Mode = "login" | "signup";
type AuthField = "username" | "password" | "confirm";

interface Props {
  mode: Mode;
  /** Sign-up can be switched off by an admin or with ALLOW_SIGNUP=false. */
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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<AuthField, string>>>({});
  const summaryRef = useRef<HTMLDivElement>(null);

  function fail(message: string, field?: AuthField) {
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
      if (confirm !== password) return fail("Passwords don't match.", "confirm");
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
        // New accounts go to first-run setup; it sends anyone with a profile on to Today.
        reloadTo(signup ? "/welcome" : "/");
        return;
      }
      const data = await response.json().catch(() => null);
      fail(data?.error ?? "Something went wrong. Try again.", data?.field);
    } catch {
      fail("Couldn't reach the app. Check your connection and try again.");
    }
    setBusy(false);
  }

  const describedBy = (field: AuthField, help?: string) =>
    [fieldErrors[field] ? `${id}-${field}-error` : "", help ?? ""].filter(Boolean).join(" ") ||
    undefined;

  const fieldError = (field: AuthField) =>
    fieldErrors[field] && (
      <FieldError id={`${id}-${field}-error`} role="none">
        {fieldErrors[field]}
      </FieldError>
    );

  const passwordType = showPassword ? "text" : "password";

  return (
    <div className="mx-auto w-full max-w-sm">
      <Wordmark />

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="type-title">{signup ? "Create account" : "Log in"}</h1>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div ref={summaryRef} tabIndex={-1} role="alert" className="outline-none">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription className="text-destructive">{formError}</AlertDescription>
              </Alert>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <FieldGroup className="gap-5">
              <Field data-invalid={!!fieldErrors.username || undefined}>
                <FieldLabel htmlFor={`${id}-username`}>Username</FieldLabel>
                <Input
                  id={`${id}-username`}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={USERNAME_MAX}
                  aria-invalid={!!fieldErrors.username || undefined}
                  aria-describedby={describedBy("username", signup ? `${id}-username-help` : undefined)}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                {signup && (
                  <FieldDescription id={`${id}-username-help`} className="text-xs">
                    {USERNAME_MIN} to {USERNAME_MAX} characters: letters, numbers, _ and -.
                  </FieldDescription>
                )}
                {fieldError("username")}
              </Field>

              <Field data-invalid={!!fieldErrors.password || undefined}>
                <FieldLabel htmlFor={`${id}-password`}>Password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={`${id}-password`}
                    type={passwordType}
                    autoComplete={signup ? "new-password" : "current-password"}
                    aria-invalid={!!fieldErrors.password || undefined}
                    aria-describedby={describedBy("password", signup ? `${id}-password-help` : undefined)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="sm"
                      className="h-9 px-3 text-primary"
                      aria-pressed={showPassword}
                      aria-controls={`${id}-password`}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {signup && (
                  <FieldDescription id={`${id}-password-help`} className="text-xs tabular-nums">
                    At least {PASSWORD_MIN} characters ({Math.min(password.length, PASSWORD_MIN)} of {PASSWORD_MIN}).
                  </FieldDescription>
                )}
                {fieldError("password")}
              </Field>

              {signup && (
                <Field data-invalid={!!fieldErrors.confirm || undefined}>
                  <FieldLabel htmlFor={`${id}-confirm`}>Confirm password</FieldLabel>
                  <Input
                    id={`${id}-confirm`}
                    type={passwordType}
                    autoComplete="new-password"
                    aria-invalid={!!fieldErrors.confirm || undefined}
                    aria-describedby={describedBy("confirm")}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  {fieldError("confirm")}
                </Field>
              )}

              <Button type="submit" className="w-full" disabled={busy}>
                {busy && <Spinner data-icon="inline-start" />}
                {signup ? (busy ? "Creating account…" : "Create account") : busy ? "Logging in…" : "Log in"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {signup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className={cn(buttonVariants({ variant: "link" }), "px-1")}>
              Log in
            </Link>
          </>
        ) : signupAllowed ? (
          <>
            No account yet?{" "}
            <Link href="/signup" className={cn(buttonVariants({ variant: "link" }), "px-1")}>
              Create account
            </Link>
          </>
        ) : (
          "Sign-up is closed. Ask the app's admin for an account."
        )}
      </p>
    </div>
  );
}
