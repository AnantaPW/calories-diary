import { cn } from "cn"

/**
 * The app's loading mark: a plate rim with a short arc travelling round it.
 * `thickness` is the rim width in 24-unit viewBox terms (3 for icon size;
 * thinner for the large plate placeholder).
 */
function Spinner({
  className,
  thickness = 3,
  ...props
}: React.ComponentProps<"svg"> & { thickness?: number }) {
  const r = 12 - thickness / 2
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin [animation-duration:1.4s]", className)}
      {...props}
    >
      <circle cx="12" cy="12" r={r} stroke="currentColor" strokeOpacity={0.25} strokeWidth={thickness} />
      <circle
        cx="12"
        cy="12"
        r={r}
        stroke="currentColor"
        strokeWidth={thickness}
        pathLength={100}
        strokeDasharray="22 100"
      />
    </svg>
  )
}

export { Spinner }
