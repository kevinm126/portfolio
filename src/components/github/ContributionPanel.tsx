import { WordGraph } from "@/components/features/WordGraph";

// Inlined (not imported from the "use client" ContributionGraph module, because a server
// component can only import component references across that boundary, not consts).
const LEGEND = [
  "var(--bg-chart-empty)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export function ContributionPanel() {
  return (
    <section className="gh-card band mt-6 max-md:-mx-4">
      <h2 className="text-base font-semibold text-fg">Contribution graph</h2>
      <p className="mb-4 mt-0.5 text-xs text-muted">
        Type a word and watch it render across the graph 👇
      </p>
      <WordGraph />
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-muted">
        <span>Less</span>
        {LEGEND.map((c) => (
          <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
}
