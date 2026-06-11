"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Repo } from "@/lib/github-data";
import { RepoListRow } from "./RepoListRow";

type Sort = "featured" | "name-asc" | "name-desc" | "stars";

/** Pull a star count out of a repo's metrics (e.g. "8★" or label "on GitHub"). */
function starCount(repo: Repo): number {
  for (const m of repo.metrics ?? []) {
    if (m.value.includes("★") || /star/i.test(m.label)) {
      const n = parseInt(m.value.replace(/[^0-9]/g, ""), 10);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

export function RepoFilterList({ repos }: { repos: Repo[] }) {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");

  const languages = useMemo(
    () => Array.from(new Set(repos.map((r) => r.language))).sort(),
    [repos]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = repos.filter((r) => {
      if (language !== "all" && r.language !== language) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    if (sort === "name-asc") out = [...out].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "name-desc") out = [...out].sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === "stars") out = [...out].sort((a, b) => starCount(b) - starCount(a));
    return out;
  }, [repos, query, language, sort]);

  const selectClass =
    "rounded-md border border-border bg-btn px-2.5 py-1.5 text-sm text-fg hover:bg-btn-hover focus:outline-none focus-visible:outline-2 focus-visible:outline-blue";

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <h1 className="text-base font-semibold text-fg">Repositories</h1>
        <span className="rounded-full border border-border px-2 text-xs text-muted">
          {visible.length}
        </span>
      </div>

      {/* Toolbar: search + language + sort */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-input bg-input px-3">
          <Search size={15} className="shrink-0 text-icon" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a repository…"
            aria-label="Find a repository"
            className="h-full w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Filter by language"
            className={selectClass}
          >
            <option value="all">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            aria-label="Sort repositories"
            className={selectClass}
          >
            <option value="featured">Sort: Featured</option>
            <option value="name-asc">Name (A–Z)</option>
            <option value="name-desc">Name (Z–A)</option>
            <option value="stars">Most stars</option>
          </select>
        </div>
      </div>

      <div className="mt-1">
        {visible.length === 0 ? (
          <p className="border-t border-border py-10 text-center text-sm text-muted">
            No repositories matched <span className="font-medium text-fg">“{query}”</span>.
          </p>
        ) : (
          visible.map((r) => <RepoListRow key={r.slug} repo={r} />)
        )}
      </div>
    </>
  );
}
