import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession, signupAllowed } from "@/lib/server/session";
import Wordmark from "@/components/Wordmark";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Create account · Calorie Diary" };

export default async function SignupPage() {
  if (await getSession()) redirect("/");

  if (!signupAllowed()) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <Wordmark />
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="type-section">Creating accounts is turned off</h1>
            </CardTitle>
            <CardDescription>New accounts are added by whoever runs this app.</CardDescription>
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
