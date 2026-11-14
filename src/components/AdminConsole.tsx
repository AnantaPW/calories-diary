"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { AccountRow, AdminOverview, SignupState } from "@/lib/admin";
import { fromDateKey } from "@/lib/date";
import { reloadTo } from "@/lib/client/navigate";
import { showToast } from "@/lib/client/uiStore";
import { passwordProblem } from "@/lib/userData";
import Sheet from "./Sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

type Load = { status: "loading" } | { status: "error"; text: string } | { status: "ready"; data: AdminOverview };

const shortDate = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const isoDate = (iso: string) => shortDate(new Date(iso));

type Reply<T> = { ok: true; data: T } | { ok: false; data: { error?: string; field?: string } | null };

/** Sends a JSON request; returns the parsed body, or sends a logged-out admin to the login page. */
async function send<T>(url: string, method: string, body?: unknown): Promise<Reply<T>> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) reloadTo("/login");
  const data = await response.json().catch(() => null);
  return response.ok ? { ok: true, data } : { ok: false, data };
}

async function fetchOverview(): Promise<Load> {
  try {
    const reply = await send<AdminOverview>("/api/admin", "GET");
    return reply.ok
      ? { status: "ready", data: reply.data }
      : { status: "error", text: reply.data?.error ?? "The admin page couldn't load." };
  } catch {
    return { status: "error", text: "Couldn't reach the app. Check your connection." };
  }
}

export default function AdminConsole({ selfId }: { selfId: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [resetting, setResetting] = useState<AccountRow | null>(null);
  const [deleting, setDeleting] = useState<AccountRow | null>(null);
  const accountsHeading = useRef<HTMLHeadingElement>(null);

  const refresh = async () => setLoad(await fetchOverview());

  useEffect(() => {
    let live = true;
    void fetchOverview().then((next) => live && setLoad(next));
    return () => {
      live = false;
    };
  }, []);

  const setSignup = (signup: SignupState) =>
    setLoad((current) => (current.status === "ready" ? { status: "ready", data: { ...current.data, signup } } : current));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="type-title">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage accounts and sign-up. You see counts only, never anyone&apos;s food or weight.
        </p>
      </div>

      {load.status === "loading" && (
        <div role="status" aria-label="Loading accounts" className="flex flex-col gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {load.status === "error" && (
        <Alert>
          <AlertTitle>The admin page couldn&apos;t load</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <p>{load.text} Nothing was changed.</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoad({ status: "loading" });
                void refresh();
              }}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {load.status === "ready" && (
        <>
          <Stats data={load.data} />
          <SignupCard signup={load.data.signup} onChange={setSignup} />

          <section className="flex flex-col gap-3" aria-labelledby="admin-accounts">
            <h2 id="admin-accounts" ref={accountsHeading} tabIndex={-1} className="type-section outline-none">
              Accounts ({load.data.accounts.length})
            </h2>
            <ItemGroup className="gap-2">
              {load.data.accounts.map((account) => (
                <AccountItem
                  key={account.id}
                  account={account}
                  self={account.id === selfId}
                  onReset={() => setResetting(account)}
                  onDelete={() => setDeleting(account)}
                />
              ))}
            </ItemGroup>
          </section>
        </>
      )}

      <Sheet open={!!resetting} onClose={() => setResetting(null)} title={`Reset password for ${resetting?.username ?? ""}`}>
        {resetting && (
          <ResetForm
            account={resetting}
            onDone={() => {
              setResetting(null);
              void refresh(); // the row's "Password changed" date moves
            }}
          />
        )}
      </Sheet>

      <Sheet open={!!deleting} onClose={() => setDeleting(null)} title={`Delete ${deleting?.username ?? ""}`}>
        {deleting && (
          <DeleteForm
            account={deleting}
            onDone={async () => {
              setDeleting(null);
              await refresh();
              // The row and its button are gone, so focus lands on the list instead of the page top.
              accountsHeading.current?.focus();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function Stats({ data }: { data: AdminOverview }) {
  const { stats } = data;
  const tiles: [string, number][] = [
    ["Accounts", stats.accounts],
    ["New (30 days)", stats.newAccounts30],
    ["Active (7 days)", stats.activePeople7],
    ["Entries (7 days)", stats.entries7],
    ["Unreadable diaries", stats.unreadable],
  ];
  return (
    <Card variant="plate" role="region" aria-label="Statistics">
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map(([label, value]) => (
            <div key={label} className="flex flex-col-reverse gap-1">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd
                className={
                  "font-heading text-3xl font-bold tabular-nums " +
                  (label.startsWith("Unreadable") && value > 0 ? "text-destructive" : "")
                }
              >
                {value.toLocaleString()}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function SignupCard({ signup, onChange }: { signup: SignupState; onChange: (s: SignupState) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const reply = await send<SignupState>("/api/admin/signup", "PUT", { allowed: !signup.allowed });
      if (reply.ok) {
        onChange(reply.data);
        showToast(reply.data.allowed ? "Sign-up is on." : "Sign-up is off.");
      } else setError(reply.data?.error ?? "Couldn't change sign-up. Try again.");
    } catch {
      setError("Couldn't reach the app. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="type-section">Sign-up is {signup.allowed ? "on" : "off"}</h2>
        </CardTitle>
        <CardDescription>
          {signup.allowed
            ? "Anyone who can open the app can create an account."
            : "No one can sign up. The login page tells people to ask an admin."}{" "}
          {signup.source === "saved"
            ? "Set on this page."
            : "Set by ALLOW_SIGNUP in .env.local until changed here."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        {signup.unreadable && (
          <p role="alert" className="text-sm text-destructive">
            data/app.json can&apos;t be read, so ALLOW_SIGNUP decides. Fix or remove that file to change this here.
          </p>
        )}
        <div role="alert">{error && <p className="text-sm text-destructive">{error}</p>}</div>
        <Button variant="outline" disabled={busy || signup.unreadable} onClick={toggle}>
          {busy && <Spinner data-icon="inline-start" />}
          {signup.allowed ? "Turn sign-up off" : "Turn sign-up on"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AccountItem({
  account,
  self,
  onReset,
  onDelete,
}: {
  account: AccountRow;
  self: boolean;
  onReset: () => void;
  onDelete: () => void;
}) {
  const { diary } = account;
  const marks = [account.isAdmin && "admin", self && "you"].filter(Boolean).join(", ");
  return (
    <Item variant="outline" className="gap-y-3">
      <ItemContent className="min-w-48">
        <ItemTitle className="text-base">
          <span className="break-all">{account.username}</span>
          {marks && <span className="font-normal text-muted-foreground">({marks})</span>}
        </ItemTitle>
        <ItemDescription>
          Joined {isoDate(account.createdAt)} · Password changed {isoDate(account.passwordChangedAt)}
        </ItemDescription>
        {diary === null ? (
          <p className="text-sm font-medium text-destructive">Diary file can&apos;t be read, so no counts.</p>
        ) : (
          <p className="text-sm tabular-nums">
            {diary.entryCount === 0
              ? "Nothing logged yet"
              : `${diary.entryCount.toLocaleString()} ${diary.entryCount === 1 ? "entry" : "entries"} · last logged ${shortDate(fromDateKey(diary.lastLogged!))}`}
          </p>
        )}
      </ItemContent>
      {!self && (
        <ItemActions className="flex-wrap">
          <Button variant="outline" onClick={onReset}>
            Reset password
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </ItemActions>
      )}
    </Item>
  );
}

function ResetForm({ account, onDone }: { account: AccountRow; onDone: () => void }) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ field?: "password" | "confirm"; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = passwordProblem(password, account.username);
    if (problem) return setError({ field: "password", text: problem });
    if (confirm !== password) return setError({ field: "confirm", text: "Passwords don't match." });
    setBusy(true);
    setError(null);
    try {
      const reply = await send(`/api/admin/accounts/${account.id}/password`, "POST", { password });
      if (reply.ok) {
        showToast(`Password reset. ${account.username} is logged out everywhere.`);
        onDone();
      } else {
        const field = reply.data?.field === "password" ? "password" : undefined;
        setError({ field, text: reply.data?.error ?? "Couldn't reset the password. Try again." });
      }
    } catch {
      setError({ text: "Couldn't reach the app. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  const field = (name: "password" | "confirm", label: string, value: string, set: (v: string) => void) => (
    <Field data-invalid={error?.field === name || undefined}>
      <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
      <Input
        id={`${id}-${name}`}
        type="password"
        autoComplete="new-password"
        aria-invalid={error?.field === name || undefined}
        aria-describedby={error?.field === name ? `${id}-error` : undefined}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    </Field>
  );

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-4">
        {field("password", "New password", password, setPassword)}
        {field("confirm", "Confirm new password", confirm, setConfirm)}
        <FieldDescription className="text-xs">
          At least 8 characters. This logs {account.username} out everywhere.
        </FieldDescription>
        <div role="alert">{error && <FieldError id={`${id}-error`} role="none">{error.text}</FieldError>}</div>
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">
          {busy && <Spinner data-icon="inline-start" />}
          {busy ? "Setting…" : "Set new password"}
        </Button>
      </FieldGroup>
    </form>
  );
}

function DeleteForm({ account, onDone }: { account: AccountRow; onDone: () => void | Promise<void> }) {
  const id = useId();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = typed === account.username;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !matches) return;
    setBusy(true);
    setError(null);
    try {
      const reply = await send(`/api/admin/accounts/${account.id}`, "DELETE", { confirm: typed });
      if (reply.ok) {
        showToast(`Deleted ${account.username}.`);
        await onDone();
      } else setError(reply.data?.error ?? "Couldn't delete the account. Try again.");
    } catch {
      setError("Couldn't reach the app. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <FieldGroup className="gap-4">
        <p className="text-sm">
          This deletes {account.username}&apos;s account and diary
          {account.diary ? ` (${account.diary.entryCount.toLocaleString()} entries)` : ""}. It can&apos;t be undone.
        </p>
        <Field data-invalid={!!error || undefined}>
          <FieldLabel htmlFor={`${id}-confirm`}>Type {account.username} to confirm</FieldLabel>
          <Input
            id={`${id}-confirm`}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-describedby={error ? `${id}-error` : undefined}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </Field>
        <div role="alert">{error && <FieldError id={`${id}-error`} role="none">{error}</FieldError>}</div>
        <Button type="submit" variant="destructive" disabled={busy || !matches} className="w-full sm:w-auto">
          {busy && <Spinner data-icon="inline-start" />}
          {busy ? "Deleting…" : `Delete ${account.username}`}
        </Button>
      </FieldGroup>
    </form>
  );
}
