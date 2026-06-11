import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Book } from "lucide-react";
import { GitHubIcon } from "@/components/ui/icons";
import { TopHeader } from "@/components/github/TopHeader";
import { SiteFooter } from "@/components/github/SiteFooter";
import { projects } from "@/content/content";
import { repoBySlug } from "@/lib/github-data";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: p.title, description: p.blurb };
}

export default async function RepoDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) notFound();
  const repo = repoBySlug(slug);

  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab="portfolio" />
      <main className="mx-auto w-full max-w-[1216px] flex-1 px-4 py-6 sm:px-8">
        <Link href="/portfolio" className="mb-5 inline-flex items-center gap-1.5 text-sm text-link hover:underline">
          <ArrowLeft size={15} /> Go back
        </Link>

        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
          <Book size={18} className="text-icon" />
          <h1 className="text-2xl font-semibold text-fg">{repo?.name ?? p.slug}</h1>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-icon">Public</span>
          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            {repo?.demoUrl && (
              <a href={repo.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blue px-3 text-sm font-medium text-white hover:brightness-110">
                <ExternalLink size={14} /> View Demo
              </a>
            )}
            {repo?.codeUrl && (
              <a href={repo.codeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-green px-3 text-sm font-medium text-white hover:brightness-110">
                <GitHubIcon size={14} /> Source Code
              </a>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <article className="min-w-0 flex-1">
            <h2 className="text-[26px] font-bold leading-tight text-fg">{p.title}</h2>
            <p className="mt-2 text-muted">{p.description}</p>

            {p.metrics && (
              <div className="mt-4 flex flex-wrap gap-3">
                {p.metrics.map((m) => (
                  <div key={m.label} className="rounded-md border border-border px-4 py-2 text-center">
                    <div className="font-mono text-lg font-bold text-green">{m.value}</div>
                    <div className="text-xs text-muted">{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            {p.caseStudy ? (
              <div className="mt-8 space-y-8">
                <Block title="The problem">
                  <p className="text-muted">{p.caseStudy.problem}</p>
                </Block>
                <Block title="Approach">
                  <ol className="space-y-2">
                    {p.caseStudy.approach.map((a, i) => (
                      <li key={i} className="flex gap-3 text-muted">
                        <span className="font-mono text-green">{i + 1}.</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ol>
                </Block>
                <Block title="Result">
                  <p className="text-muted">{p.caseStudy.result}</p>
                </Block>
                <Block title="Stack">
                  <div className="flex flex-wrap gap-2">
                    {p.caseStudy.stack.map((s) => (
                      <span key={s} className="rounded border border-border px-2.5 py-1 font-mono text-xs text-muted">
                        {s}
                      </span>
                    ))}
                  </div>
                </Block>
              </div>
            ) : null}
          </article>

          <aside className="w-full shrink-0 lg:w-[296px]">
            <div className="gh-card">
              <h3 className="text-sm font-semibold text-fg">About</h3>
              <p className="mt-2 text-sm text-muted">{p.blurb}</p>
              {repo && (
                <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: repo.languageColor }} />
                  {repo.language}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.tags.map((t) => (
                  <span key={t} className="rounded-full bg-tag-bg px-2 py-0.5 text-xs text-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xl font-semibold text-fg">{title}</h3>
      {children}
    </section>
  );
}
