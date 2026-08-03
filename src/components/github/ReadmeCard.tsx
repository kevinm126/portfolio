import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";
import { profile } from "@/content/content";
import { techBadges } from "@/lib/github-data";

export function ReadmeCard() {
  return (
    <section className="gh-card band overflow-hidden p-0 max-md:-mx-4">
      {/* banner */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden border-b border-border bg-[radial-gradient(circle_at_30%_30%,#1f6feb33,transparent_60%),radial-gradient(circle_at_75%_60%,#23863633,transparent_55%)]">
        <span className="font-mono text-sm text-icon">{profile.handle}/README.md</span>
      </div>

      <div className="p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-icon">
          <BookOpen size={14} />
          <span className="font-mono">README.md</span>
        </div>

        <h1 className="text-[28px] font-semibold leading-tight text-fg sm:text-[32px]">
          Hi <span aria-hidden>👋</span>, I&apos;m {profile.name}
        </h1>

        <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-fg/90">
          {profile.about.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <Link
          href="/contact"
          className="mt-5 inline-flex h-[34px] items-center gap-2 rounded-md bg-green px-4 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Mail size={15} /> Get in Touch
        </Link>

        <h2 className="mb-3 mt-7 text-base font-semibold text-fg">
          Technologies I&apos;ve Worked With:
        </h2>
        <ul className="flex flex-wrap gap-2">
          {techBadges.map((t) => (
            <li
              key={t.label}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-fg"
              style={{ background: `${t.color}1f`, borderColor: `${t.color}55` }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
              {t.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
