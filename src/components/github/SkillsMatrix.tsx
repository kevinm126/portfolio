import Link from "next/link";
import { skillGroups, projects } from "@/content/content";

/**
 * Skills a recruiter can actually verify: grouped by category, with the
 * self-assessed level bar and, where a project proves the skill, links
 * straight to the evidence. Replaces the old flat 22-badge cloud.
 */
export function SkillsMatrix() {
  const titleOf = (slug: string) => projects.find((p) => p.slug === slug)?.title ?? slug;

  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {skillGroups.map((group) => (
        <section key={group.category}>
          <h3 className="mb-2 text-sm font-semibold text-fg">{group.category}</h3>
          <ul className="space-y-2">
            {group.items.map((skill) => (
              <li key={skill.name} className="text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-fg">{skill.name}</span>
                  {skill.provenBy && (
                    <span className="flex flex-wrap justify-end gap-x-2 text-xs">
                      {skill.provenBy.map((slug) => (
                        <Link
                          key={slug}
                          href={`/projects/${slug}`}
                          className="text-muted underline-offset-2 hover:text-link hover:underline"
                        >
                          {titleOf(slug)}
                        </Link>
                      ))}
                    </span>
                  )}
                </div>
                {typeof skill.level === "number" && (
                  <div
                    className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-btn"
                    role="meter"
                    aria-valuenow={skill.level}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${skill.name} proficiency`}
                  >
                    <div
                      className="h-full rounded-full bg-green"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
