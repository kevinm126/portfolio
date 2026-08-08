import type { Metadata } from "next";
import { Download, Mail } from "lucide-react";
import { TopHeader } from "@/components/github/TopHeader";
import { SiteFooter } from "@/components/github/SiteFooter";
import { profile, projects, socials } from "@/content/content";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "Kevin Marin's résumé for entry-level Data Science / Software Engineering roles. Quick facts, top projects, and the PDF.",
};

/**
 * The page to paste into applications: everything a screener needs in one
 * scroll: availability, contact, three projects with outcomes, the PDF.
 */
export default function ResumePage() {
  const top = (
    projects.filter((p) => p.featured).length >= 3
      ? projects.filter((p) => p.featured)
      : projects
  ).slice(0, 3);
  const linkedIn = socials.find((s) => s.icon === "linkedin");

  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab="resume" />
      <main className="mx-auto w-full max-w-[895px] flex-1 px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-fg">{profile.name}</h1>
            <p className="mt-1 text-sm text-fg">{profile.availability.status}</p>
            <p className="mt-0.5 text-sm text-muted">{profile.availability.facts}</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1.5 text-link hover:underline">
                <Mail size={14} aria-hidden />
                {profile.email}
              </a>
              {linkedIn && (
                <a
                  href={linkedIn.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  LinkedIn
                </a>
              )}
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                GitHub
              </a>
            </p>
          </div>
          <a
            href={profile.resumeUrl}
            download="Kevin-Marin-Resume.pdf"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-green px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            <Download size={15} aria-hidden />
            Download résumé
          </a>
        </div>

        {/* three projects, outcomes first: the fastest read on the site */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {top.map((p) => (
            <a
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="rounded-md border border-border bg-surface p-3 hover:border-icon"
            >
              <div className="text-sm font-semibold text-link">{p.title}</div>
              {p.metrics?.[0] && (
                <div className="mt-1 text-xs text-green">
                  <span className="font-semibold">{p.metrics[0].value}</span>{" "}
                  {p.metrics[0].label}
                </div>
              )}
              <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted">{p.blurb}</p>
            </a>
          ))}
        </div>

        {/* the PDF itself */}
        <div className="mt-6 overflow-hidden rounded-md border border-border">
          <object
            data={profile.resumeUrl}
            type="application/pdf"
            className="block h-[900px] w-full"
            aria-label="Kevin Marin's résumé PDF"
          >
            <p className="p-6 text-sm text-muted">
              Your browser can&apos;t display the PDF inline;{" "}
              <a href={profile.resumeUrl} className="text-link hover:underline" download>
                download it instead
              </a>
              .
            </p>
          </object>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
