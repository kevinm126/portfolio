import { Briefcase, GraduationCap } from "lucide-react";
import { certifications, education, experience } from "@/content/content";

/**
 * The two facts recruiters scan for first — where has he worked, and when
 * does he graduate — rendered as a GitHub-style card with dates prominent.
 * This data previously existed only inside the chatbot's knowledge.
 */
export function ExperienceSection() {
  return (
    <section className="gh-card band mt-5 p-6 max-md:-mx-4">
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-fg">
        <Briefcase size={16} className="text-icon" aria-hidden />
        Experience
      </h2>
      <ul className="space-y-5">
        {experience.map((job) => (
          <li key={`${job.org}-${job.role}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-semibold text-fg">
                {job.role} · <span className="text-link">{job.org}</span>
              </p>
              <p className="text-sm text-muted">
                {job.start} – {job.end}
                {job.location ? ` · ${job.location}` : ""}
              </p>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">{job.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-fg/90">
              {job.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {job.tech && (
              <p className="mt-2 flex flex-wrap gap-1.5">
                {job.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-tag-bg px-2 py-0.5 text-xs font-medium text-tag"
                  >
                    {t}
                  </span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>

      <h2 className="mb-4 mt-7 flex items-center gap-2 border-t border-border pt-6 text-base font-semibold text-fg">
        <GraduationCap size={16} className="text-icon" aria-hidden />
        Education
      </h2>
      <ul className="space-y-4">
        {education.map((ed) => (
          <li key={ed.school}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="font-semibold text-fg">{ed.school}</p>
              <p className="text-sm text-muted">
                {ed.start} – {ed.end}
              </p>
            </div>
            <p className="mt-0.5 text-sm text-fg/90">{ed.credential}</p>
            {ed.details && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted">
                {ed.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 flex flex-wrap gap-1.5">
        {certifications.map((c) => (
          <span
            key={c.name}
            className="rounded-full bg-tag-bg px-2 py-0.5 text-xs font-medium text-tag"
            title={`${c.issuer} · ${c.year}`}
          >
            {c.name} · {c.year}
          </span>
        ))}
      </p>
    </section>
  );
}
