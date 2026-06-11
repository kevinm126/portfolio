"use client";

import { useEffect, useRef } from "react";

export type Intensity = 0 | 1 | 2 | 3 | 4;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export const CONTRIB_COLORS = [
  "var(--bg-chart-empty)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
] as const;

export function ContributionGraph({
  data,
  colors = CONTRIB_COLORS,
  cell = 11,
  gap = 3,
  ariaLabel = "Contribution graph",
}: {
  data: number[][];
  colors?: readonly string[];
  cell?: number;
  gap?: number;
  ariaLabel?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const rows = data.length || 7;
  const weeks = data[0]?.length ?? 53;
  const step = cell + gap;
  const leftPad = 30;
  const topPad = 16;
  const width = leftPad + weeks * step;
  const height = topPad + rows * step;

  // On mobile the grid is wider than the viewport; center it so a typed word is visible.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = Math.max(0, (el.scrollWidth - el.clientWidth) / 2);
  }, [data]);

  return (
    <div ref={scroller} className="overflow-x-auto">
      <svg width={width} height={height} className="block" role="img" aria-label={ariaLabel}>
        {MONTHS.map((m, i) => (
          <text
            key={m}
            x={leftPad + Math.round((i * weeks) / 12) * step}
            y={10}
            fill="var(--text-secondary)"
            fontSize="10"
          >
            {m}
          </text>
        ))}
        {Array.from({ length: rows }, (_, r) => {
          const d = DAY_LABELS[r % 7];
          return d ? (
            <text key={r} x={0} y={topPad + r * step + cell - 1} fill="var(--text-secondary)" fontSize="9">
              {d}
            </text>
          ) : null;
        })}
        {data.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`${r}-${c}`}
              x={leftPad + c * step}
              y={topPad + r * step}
              width={cell}
              height={cell}
              rx="2"
              fill={colors[Math.max(0, Math.min(4, v))]}
            />
          ))
        )}
      </svg>
    </div>
  );
}
