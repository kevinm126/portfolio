import { profile, socials } from "@/content/content";
import { SocialIcon } from "@/components/ui/icons";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const links = socials;
  return (
    // pb-28 clears the fixed Copilot launcher (h-12 + bottom-5) at every width
    <footer className="mt-auto px-4 pb-28 pt-16 sm:px-8">
      <div className="mx-auto flex max-w-[1216px] flex-col items-center gap-4 border-t border-border pt-8 text-sm text-muted sm:flex-row sm:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {links.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-link"
            >
              <SocialIcon name={s.icon} size={14} className="text-icon" />
              {s.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-[10px] text-fg">
            {profile.initials}
          </span>
          <span>© {year} {profile.name}</span>
        </div>
      </div>
    </footer>
  );
}
