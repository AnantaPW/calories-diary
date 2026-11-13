import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession, signupAllowed } from "@/lib/server/session";

export const metadata: Metadata = { title: "Log in · Calorie Diary" };

export default async function LoginPage() {
  if (await getSession()) redirect("/");
  return <AuthForm mode="login" signupAllowed={signupAllowed()} />;
}
