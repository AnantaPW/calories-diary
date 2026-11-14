import { cache } from "react";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import Nav from "@/components/Nav";
import LogFoodSheet from "@/components/LogFoodSheet";
import { Toaster } from "@/components/ui/toast";
import { getSession } from "@/lib/server/session";
import { readUserData } from "@/lib/server/userStore";
import { DEFAULT_THEME } from "@/lib/theme";
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
  icons: {
    icon: "/logo/favicon.svg",
    apple: "/logo/app-icon.svg",
  },
  openGraph: {
    title: "Calorie Diary",
    description: "Log what you eat. See the day as a plate.",
    images: [{ url: "/images/og-image.svg", width: 1200, height: 630 }],
  },
};

/** The signed-in person's theme colour and mode, set on the server so there's no flash of the default. */
const themeForRequest = cache(async () => {
  const session = await getSession().catch(() => null);
  if (!session) return DEFAULT_THEME;
  const data = await readUserData(session.user.id).catch(() => null);
  return data?.status === "ok" ? data.value.settings : DEFAULT_THEME;
});

// The table colour in each mode (globals.css), so the phone's browser bar blends in.
const TABLE = { light: "#e3e0d8", dark: "#16130e" };

export async function generateViewport(): Promise<Viewport> {
  const { mode } = await themeForRequest();
  return {
    themeColor:
      mode === "system"
        ? [
            { media: "(prefers-color-scheme: light)", color: TABLE.light },
            { media: "(prefers-color-scheme: dark)", color: TABLE.dark },
          ]
        : TABLE[mode],
    colorScheme: mode === "system" ? "light dark" : mode,
    // Lets the bottom nav pad itself around the home indicator.
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { accent, mode } = await themeForRequest();

  return (
    <html lang="en" data-accent={accent} data-mode={mode} className={`${geistSans.variable} ${bricolage.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        {/* One toast at a time: "Added…", "Removed… Undo" and save errors never stack. */}
        <Toaster limit={1} timeout={6000}>
          <Nav />
          {/* Bottom padding on phones reserves the space the fixed tab bar covers. */}
          <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-10 sm:pt-8 lg:max-w-5xl">
            {children}
          </main>
          <LogFoodSheet />
        </Toaster>
      </body>
    </html>
  );
}
