import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WelcomeSteps from "@/components/WelcomeSteps";
import { getSession } from "@/lib/server/session";
import { readUserData } from "@/lib/server/userStore";

export const metadata: Metadata = { title: "Set up your target · Calorie Diary" };

/** First-run setup. Only for people with no saved profile; everyone else goes to Today. */
export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const data = await readUserData(session.user.id);
  // An unreadable diary file shows its error on Today, not here.
  if (data.status !== "ok" || data.value.profile) redirect("/");

  return <WelcomeSteps />;
}
