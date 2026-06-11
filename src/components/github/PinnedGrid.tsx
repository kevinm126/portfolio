import { pinnedRepos } from "@/lib/github-data";
import { RepoCard } from "./RepoCard";

export function PinnedGrid() {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-base text-fg">Pinned</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
        {pinnedRepos.map((r) => (
          <RepoCard key={r.slug} repo={r} />
        ))}
      </div>
    </section>
  );
}
