/**
 * The login and sign-up header: the name in the display face, with one empty
 * plate behind it. The plate is the app's own motif, the only decoration here.
 */
export default function Wordmark() {
  return (
    <div className="relative mb-6 flex h-28 items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="absolute" aria-hidden="true">
        <circle cx="56" cy="56" r="48" fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
          r="48"
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="10"
          strokeDasharray={`${2 * Math.PI * 48 * 0.18} ${2 * Math.PI * 48}`}
          transform="rotate(-90 56 56)"
        />
      </svg>
      <p className="relative font-display text-2xl font-bold tracking-tight">Calorie Diary</p>
    </div>
  );
}
