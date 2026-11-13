"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { openLog } from "@/lib/client/uiStore";
import { DiaryIcon, HistoryIcon, PlusIcon, ProfileIcon, TodayIcon } from "./icons";

const LINKS = [
  { href: "/", label: "Today", Icon: TodayIcon },
  { href: "/diary", label: "Diary", Icon: DiaryIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  // The login and sign-up pages show only the wordmark on their card.
  if (pathname === "/login" || pathname === "/signup") return null;

  const tab = ({ href, label, Icon }: (typeof LINKS)[number]) => {
    const active = isActive(href);
    return (
      <li key={href}>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] active:bg-surface-2 ${
            active ? "font-semibold text-brand" : "font-medium text-muted"
          }`}
        >
          <span
            className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? "bg-focal" : ""}`}
          >
            <Icon />
          </span>
          {label}
        </Link>
      </li>
    );
  };

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 sm:px-6 lg:max-w-5xl">
          <Link
            href="/"
            className="flex min-h-12 items-center font-display text-lg font-bold tracking-tight text-ink sm:min-h-16 sm:text-xl"
          >
            Calorie Diary
          </Link>

          {/* From 640px the links and the log button sit in the top bar. */}
          <nav aria-label="Main" className="hidden items-center gap-3 sm:flex">
            <ul className="flex gap-1">
              {LINKS.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-[10px] px-3 text-sm ${
                        active
                          ? "bg-focal font-semibold text-brand"
                          : "font-medium text-muted hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="btn-primary" onClick={() => openLog()}>
              <PlusIcon width={18} height={18} />
              Log food
            </button>
          </nav>
        </div>
      </header>

      {/*
        Phones: the four destinations plus a round "+" in the middle, because
        logging food is the most frequent action and should be one tap away
        from every screen.
      */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <ul className="grid grid-cols-5 items-center">
          {LINKS.slice(0, 2).map(tab)}
          <li className="flex justify-center">
            <button
              type="button"
              onClick={() => openLog()}
              aria-label="Log food"
              className="-mt-5 flex size-14 items-center justify-center rounded-full border-4 border-bg bg-brand text-on-brand hover:bg-brand-strong active:translate-y-px"
            >
              <PlusIcon width={26} height={26} strokeWidth={2.25} />
            </button>
          </li>
          {LINKS.slice(2).map(tab)}
        </ul>
      </nav>
    </>
  );
}
