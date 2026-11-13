import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession, signupAllowed } from "@/lib/server/session";
import Wordmark from "@/components/Wordmark";

export const metadata: Metadata = { title: "Create account · Calorie Diary" };

export default async function SignupPage() {
  if (await getSession()) redirect("/");

  if (!signupAllowed()) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <Wordmark />
        <div className="card">
          <h1 className="section-title">Creating accounts is turned off</h1>
          <p className="mt-2 text-sm text-muted">
            New accounts are added by whoever runs this app.
          </p>
          <Link href="/login" className="btn-primary mt-4 w-full">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return <AuthForm mode="signup" signupAllowed />;
}
