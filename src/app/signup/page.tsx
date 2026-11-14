import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { signupAllowed } from "@/lib/server/admin";
import { getSession } from "@/lib/server/session";
import Wordmark from "@/components/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Create account · Calorie Diary" };

export default async function SignupPage() {
  if (await getSession()) redirect("/");

  if (!(await signupAllowed())) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <Wordmark />
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="type-section">Sign-up is closed</h1>
            </CardTitle>
            <CardDescription>Ask the app&apos;s admin for an account.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login" className={cn(buttonVariants(), "w-full")}>
              Back to log in
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return <AuthForm mode="signup" signupAllowed />;
}
