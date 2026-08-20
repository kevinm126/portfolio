"use client";

/** Ten animated probability bars for the digit lab. */

type Props = {
  probs: Float32Array | null;
  labels: string[];
};

export function ProbabilityBars({ probs, labels }: Props) {
  let top = -1;
  if (probs) {
    top = 0;
    for (let i = 1; i < probs.length; i++) if (probs[i] > probs[top]) top = i;
  }
  return (
    <div className="flex flex-col gap-1" aria-hidden>
      {labels.map((label, i) => {
        const p = probs ? probs[i] : 0;
        const isTop = i === top && p > 0.01;
        return (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className={isTop ? "w-4 font-semibold text-fg" : "w-4 text-muted"}>{label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-sm bg-btn">
              <div
                className={
                  "h-full rounded-sm transition-[width] duration-150 ease-out motion-reduce:transition-none " +
                  (isTop ? "bg-green" : "bg-border")
                }
                style={{ width: `${Math.max(p * 100, p > 0 ? 1 : 0)}%` }}
              />
            </div>
            <span className={"w-10 text-right tabular-nums " + (isTop ? "font-semibold text-fg" : "text-muted")}>
              {(p * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
