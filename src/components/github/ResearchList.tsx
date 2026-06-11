import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { papers, projects, type ResearchPaper } from "@/content/content";

function Rating({ n }: { n: number }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < n ? "text-[#e3b341]" : "text-icon/40"}
          fill={i < n ? "#e3b341" : "none"}
        />
      ))}
    </span>
  );
}

function PaperRow({ paper }: { paper: ResearchPaper }) {
  const related = paper.relatedProject
    ? projects.find((p) => p.slug === paper.relatedProject)
    : undefined;

  return (
    <article className="border-b border-border py-5 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-start gap-1.5 text-lg font-semibold leading-snug text-link hover:underline"
        >
          {paper.title}
          <ExternalLink size={14} className="mt-1 shrink-0 opacity-60 group-hover:opacity-100" />
        </a>
        <Rating n={paper.rating} />
      </div>

      <p className="mt-1 text-sm text-muted">
        {paper.authors} · {paper.venue} · {paper.year}
      </p>

      <p className="mt-3 border-l-2 border-border pl-3 text-sm italic leading-relaxed text-fg">
        {paper.takeaway}
      </p>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{paper.review}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {paper.tags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-tag-bg px-2.5 py-0.5 text-xs font-medium text-tag"
          >
            {t}
          </span>
        ))}
        {related && (
          <Link
            href={`/projects/${related.slug}`}
            className="ml-auto text-xs text-muted hover:text-link"
          >
            Related project: <span className="font-medium">{related.title}</span> →
          </Link>
        )}
      </div>
    </article>
  );
}

export function ResearchList() {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <h1 className="text-base font-semibold text-fg">Research reviews</h1>
        <span className="rounded-full border border-border px-2 text-xs text-muted">
          {papers.length}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Papers I&apos;ve read and what stuck with me — a running reading list across information
        retrieval, machine learning, NLP, statistics, and systems. Titles link out to the source.
      </p>
      <div className="mt-1">
        {papers.map((p) => (
          <PaperRow key={p.slug} paper={p} />
        ))}
      </div>
    </>
  );
}
