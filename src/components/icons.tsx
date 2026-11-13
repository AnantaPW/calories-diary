/*
 * Hand-drawn 24px glyphs with square ends, one per destination or action.
 * Each one pictures what it opens: a sun for today, a book for the diary,
 * a calendar page for history, a person for the profile.
 */
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Glyph({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const TodayIcon = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
  </Glyph>
);

export const DiaryIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5ZM12 6.5v13" />
  </Glyph>
);

export const HistoryIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4M8 14h2M14 14h2M8 17h2" />
  </Glyph>
);

export const ProfileIcon = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5" />
  </Glyph>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Glyph>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Glyph>
);

export const CloseIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Glyph>
);

export const PlusIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M12 5v14M5 12h14" />
  </Glyph>
);

export const CalendarIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M4 6h16v14H4zM4 10h16M8 3.5v4M16 3.5v4" />
  </Glyph>
);

// ---- Meal glyphs: the time of day each meal belongs to ----

/** Breakfast: the sun coming up over the horizon. */
export const SunriseIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 7v3M5.2 11.2l1.6 1.6M18.8 11.2l-1.6 1.6M7 21h10" />
  </Glyph>
);

/** Lunch: the sun high in the sky. */
export const SunIcon = (p: IconProps) => (
  <Glyph {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
  </Glyph>
);

/** Dinner: the moon. */
export const MoonIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
  </Glyph>
);

/** Snacks: a cup, for the bites and drinks between meals. */
export const CupIcon = (p: IconProps) => (
  <Glyph {...p}>
    <path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M11.5 3.5v2.5" />
  </Glyph>
);
