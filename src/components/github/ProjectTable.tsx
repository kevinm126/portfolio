import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { GitHubIcon } from "@/components/ui/icons";
import type { Repo } from "@/lib/github-data";
import { cn } from "@/lib/utils";

export function ProjectTable({
  repos,
  title,
  count = false,
  className,
}: {
  repos: Repo[];
  title: string;
  count?: boolean;
  className?: string;
}) {
  return (
    <section className={cn(className)}>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {count && (
          <span className="rounded-full border border-border px-2 text-xs text-muted">
            {repos.length}
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Project</th>
              <th className="px-3 py-2 font-medium">Stack</th>
              <th className="px-3 py-2 font-medium">Outcome</th>
              <th className="px-3 py-2 font-medium text-right">Links</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((r) => {
              const outcome = r.metrics?.[0] ? `${r.metrics[0].value} ${r.metrics[0].label}` : "-";
              return (
                <tr key={r.slug} className="border-b border-border align-top last:border-b-0 hover:bg-card-hover">
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <Link href={r.href} className="font-semibold text-link hover:underline">
                        {r.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: r.languageColor }} />
                        {r.language}
                      </span>
                    </div>
                    <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted">{r.description}</p>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted">{r.tags.slice(0, 4).join(" · ")}</td>
                  <td className="px-3 py-2.5 text-xs text-green">{outcome}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-2.5 text-icon">
                      {r.demoUrl && (
                        <a href={r.demoUrl} target="_blank" rel="noopener noreferrer" aria-label={`${r.title} live demo`} className="hover:text-link">
                          <ExternalLink size={15} />
                        </a>
                      )}
                      {r.codeUrl && (
                        <a href={r.codeUrl} target="_blank" rel="noopener noreferrer" aria-label={`${r.title} source code`} className="hover:text-link">
                          <GitHubIcon size={15} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
