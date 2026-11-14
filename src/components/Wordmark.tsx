/**
 * The Plate Ring logo (public/logo/ holds the file versions). Drawn inline so it
 * follows the chosen accent and light or dark mode. It sits on the page background.
 */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <circle cx="50" cy="50" r="37" fill="none" stroke="var(--border)" strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r="37"
        fill="none"
        stroke="var(--primary)"
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="69.7 232.5"
        transform="rotate(-90 50 50)"
      />
      <circle cx="85.19" cy="61.43" r="9.5" fill="var(--primary)" stroke="var(--background)" strokeWidth="3" />
    </svg>
  );
}

/** The login and sign-up header: the logo above the name. */
export default function Wordmark() {
  return (
    <div className="mb-6 flex flex-col items-center gap-3">
      <LogoMark size={72} />
      <p className="font-heading text-2xl font-bold tracking-tight">Calorie Diary</p>
    </div>
  );
}
