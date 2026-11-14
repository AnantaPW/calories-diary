"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Entrance: each arc draws for ARC_MS, the next one starting ARC_STAGGER_MS later. */
const ARC_MS = 700;
const ARC_STAGGER_MS = 120;

export interface PlateSegment {
  key: string;
  value: number;
  /** CSS colour, e.g. "var(--chart-1)". */
  color: string;
}

interface Props {
  segments: PlateSegment[];
  target: number;
  /** Outer size in px. */
  size: number;
  /** Rim thickness in px. */
  stroke: number;
  /** What the ring shows, for screen readers. Omit when a parent already says it. */
  label?: string;
  children?: ReactNode;
  className?: string;
  /** Draw the arcs from an empty rim when it first shows (the entrance moment). */
  drawIn?: boolean;
  /** Segment key to light up; the other arcs dim. */
  lit?: string | null;
  /** Segment keys that just changed; each arc pulses once. */
  pulse?: string[];
}

/**
 * The app's signature: the rim of a plate, filled by what was eaten.
 * Each segment (a meal, or a whole day) is an arc as long as its share of the
 * target; the empty rim is what's left. Over target, the rim closes (arcs
 * share the full circle) and an amber arc outside it shows the extra, so
 * "over" reads from the shape as well as the colour.
 */
export default function PlateRing({
  segments,
  target,
  size,
  stroke,
  label,
  children,
  className,
  drawIn = false,
  lit = null,
  pulse = [],
}: Props) {
  // start: empty rim painted; drawing: arcs grow one after another; done: normal transitions.
  const [phase, setPhase] = useState<"start" | "drawing" | "done">(drawIn ? "start" : "done");
  useEffect(() => {
    if (phase === "done") return;
    let id = 0;
    let timer = 0;
    if (phase === "start") {
      // Two frames so the empty rim is painted before the arcs grow from it.
      id = requestAnimationFrame(() => (id = requestAnimationFrame(() => setPhase("drawing"))));
    } else {
      timer = window.setTimeout(() => setPhase("done"), ARC_MS + ARC_STAGGER_MS * 5);
    }
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(timer);
    };
  }, [phase]);
  const empty = phase === "start";
  const enterStyle = (order: number) =>
    phase === "drawing" ? { transitionDuration: `${ARC_MS}ms`, transitionDelay: `${order * ARC_STAGGER_MS}ms` } : undefined;

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const over = target > 0 && total > target;

  // Room for the amber arc outside the rim, kept even when not over so the
  // plate doesn't change size when the day tips over.
  const overStroke = Math.max(2, Math.round(stroke * 0.45));
  const overGap = Math.max(2, Math.round(stroke * 0.3));
  const outerR = (size - overStroke) / 2;
  const r = outerR - overStroke / 2 - overGap - stroke / 2;
  const c = 2 * Math.PI * r;
  const outerC = 2 * Math.PI * outerR;

  // Arcs fill a share of the rim: of the target normally, of the total when over.
  const scale = over ? total : Math.max(target, 1);
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? Math.min(stroke * 0.6, 3) : 0;

  // Each arc starts where the ones before it end.
  const lengths = visible.map((s) => (s.value / scale) * c);
  const arcs = visible.map((s, i) => ({
    key: s.key,
    color: s.color,
    start: lengths.slice(0, i).reduce((sum, l) => sum + l, 0),
    length: Math.max(0, lengths[i] - gap),
  }));

  const extra = over ? Math.min(1, (total - target) / target) * outerC : 0;
  const center = size / 2;

  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 size-full -rotate-90">
        <circle cx={center} cy={center} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        {arcs.map((a, i) => (
          <circle
            key={a.key}
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${empty ? 0 : a.length} ${c}`}
            strokeDashoffset={-a.start}
            className={cn(
              "transition-[stroke-dasharray,stroke-dashoffset,opacity] duration-400 ease-(--m-ease)",
              lit && lit !== a.key && "opacity-35",
              pulse.includes(a.key) && "arc-pulse",
            )}
            style={enterStyle(i)}
          />
        ))}
        {over && (
          <circle
            cx={center}
            cy={center}
            r={outerR}
            fill="none"
            stroke="var(--over)"
            strokeWidth={overStroke}
            strokeDasharray={`${empty ? 0 : extra} ${outerC}`}
            className="transition-[stroke-dasharray] duration-400 ease-(--m-ease)"
            style={enterStyle(arcs.length)}
          />
        )}
      </svg>
      {children && <div className="relative text-center">{children}</div>}
    </div>
  );
}
