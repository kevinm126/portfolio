import Link from "next/link";
import { ExternalLink, Code2 } from "lucide-react";
import type { Repo } from "@/lib/github-data";

export function RepoListRow({ repo }: { repo: Repo }) {
  return (
    <article className="border-b border-border py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href={repo.href} className="text-xl font-semibold text-link hover:underline">
          {repo.title}
        </Link>
        <span className="rounded-full border border-border px-2 py-px text-[11px] font-medium text-icon">
          Public
        </span>
      </div>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{repo.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: repo.languageColor }} />
          {repo.language}
        </span>
        {repo.demoUrl && (
          <a href={repo.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-link">
            <ExternalLink size={13} /> Demo
          </a>
        )}
        {repo.codeUrl && (
          <a href={repo.codeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-link">
            <Code2 size={13} /> Code
          </a>
        )}
      </div>
    </article>
  );
}
