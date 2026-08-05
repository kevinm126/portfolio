import { ExternalLink } from "lucide-react";
import { papers, type ResearchPaper } from "@/content/content";

function PaperRow({ paper }: { paper: ResearchPaper }) {
  return (
    <article className="border-b border-border py-5 last:border-b-0">
      <a
        href={paper.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-start gap-1.5 text-lg font-semibold leading-snug text-link hover:underline"
      >
        {paper.title}
        <ExternalLink size={14} className="mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
      </a>

      <p className="mt-1 text-sm text-muted">
        {paper.authors} · {paper.venue} · {paper.year}
      </p>

      <p className="mt-3 max-w-2xl border-l-2 border-border pl-3 text-sm italic leading-relaxed text-fg">
        {paper.why}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {paper.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-tag-bg px-2.5 py-0.5 text-xs font-medium text-tag"
          >
            {t}
          </span>
        ))}
      </div>
    </article>
  );
}

export function ResearchList() {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <h1 className="text-base font-semibold text-fg">Paper suggestions</h1>
        <span className="rounded-full border border-border px-2 text-xs text-muted">
          {papers.length}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Papers (and one essay) I suggest to anyone getting into data science — across machine
        learning, statistics, systems, and the occasional heresy. Titles link out to the source.
      </p>
      <div className="mt-1">
        {papers.map((p) => (
          <PaperRow key={p.slug} paper={p} />
        ))}
      </div>
    </>
  );
}
