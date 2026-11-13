import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import Nav from "@/components/Nav";
import LogFoodSheet from "@/components/LogFoodSheet";
import Toast from "@/components/Toast";
import { getSession } from "@/lib/server/session";
import { readUserData } from "@/lib/server/userStore";
import { DEFAULT_ACCENT } from "@/lib/theme";
import "./globals.css";

// Geist: its even-width numerals keep calorie columns aligned, and numbers
// are the main content of this app.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
// Bricolage Grotesque: headings and focal numbers. Friendly and a little
// hand-made, which suits a food diary better than another neutral sans.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Calorie Diary",
  description: "A simple calorie counter diary for dieting",
};

export const viewport: Viewport = {
  // Matches the page background so the phone's browser bar blends in.
  themeColor: "#15140f",
  colorScheme: "dark",
  // Lets the bottom nav pad itself around the home indicator.
  viewportFit: "cover",
};

/** The signed-in person's theme colour, set on the server so there's no flash of the default. */
async function accentForRequest() {
  const session = await getSession().catch(() => null);
  if (!session) return DEFAULT_ACCENT;
  const data = await readUserData(session.user.id).catch(() => null);
  return data?.status === "ok" ? data.value.settings.accent : DEFAULT_ACCENT;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const accent = await accentForRequest();

  return (
    <html lang="en" data-accent={accent}>
      <body className={`${geistSans.variable} ${bricolage.variable} min-h-dvh font-sans antialiased`}>
        <Nav />
        {/* Bottom padding on phones reserves the space the fixed tab bar covers. */}
        <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-10 sm:pt-8 lg:max-w-5xl">
          {children}
        </main>
        <LogFoodSheet />
        <Toast />
      </body>
    </html>
  );
}
