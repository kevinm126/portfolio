import Link from "next/link";
import { Book } from "lucide-react";
import type { Repo } from "@/lib/github-data";

export function RepoCard({ repo }: { repo: Repo }) {
  return (
    <Link
      href={repo.href}
      className="group flex h-full min-w-[260px] flex-col rounded-md border border-border bg-transparent p-4 transition-colors hover:border-icon"
    >
      <div className="flex items-center gap-2">
        <Book size={15} className="shrink-0 text-icon" />
        <span className="truncate text-sm font-semibold text-link group-hover:underline">
          {repo.title}
        </span>
        <span className="ml-auto shrink-0 rounded-full border border-border px-2 py-px text-[11px] font-medium text-icon">
          Public
        </span>
      </div>
      <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-muted">
        {repo.description}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: repo.languageColor }} />
        {repo.language}
      </div>
    </Link>
  );
}
