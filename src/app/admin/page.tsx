import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminConsole from "@/components/AdminConsole";
import { isAdmin } from "@/lib/server/admin";
import { getSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Admin · Calorie Diary" };

/** Admins only; everyone else gets the normal not-found page. */
export default async function AdminPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.user)) notFound();
  return <AdminConsole selfId={session.user.id} />;
}
