import Link from "next/link";
import { MapPin, Mail } from "lucide-react";
import { profile, socials } from "@/content/content";
import { SocialIcon } from "@/components/ui/icons";
import { PageViews } from "@/components/features/page-views";
import { AnimatedAvatar } from "@/components/github/AnimatedAvatar";

export function ProfileSidebar() {
  const bio = profile.identities[0].blurb;
  const linkSocials = socials.filter((s) => s.icon !== "fileText" && s.icon !== "mail");

  return (
    <aside className="w-full shrink-0 px-4 pt-4 md:w-[256px] md:px-0 md:pt-0 min-[1010px]:w-[296px]">
      {/* avatar + name: row on mobile, stacked on md+ */}
      <div className="flex items-center gap-4 md:block">
        <AnimatedAvatar
          src={profile.avatar}
          alt={`${profile.name} avatar`}
          priority
          className="aspect-square w-20 shrink-0 min-[375px]:w-[88px] md:w-full md:max-w-[296px]"
        />
        <div className="md:mt-4">
          <h1 className="text-2xl font-semibold leading-tight text-fg">{profile.name}</h1>
          <p className="text-xl font-light text-muted">{profile.identities[0].label}</p>
        </div>
      </div>

      <Link
        href="/contact"
        className="mt-4 hidden h-[33px] w-full items-center justify-center rounded-md bg-green text-sm font-semibold text-white transition hover:brightness-110 md:flex"
      >
        Follow
      </Link>

      <p className="mt-4 text-[15px] leading-relaxed text-fg max-md:hidden">{bio}</p>

      <ul className="mt-4 space-y-2 text-sm max-md:hidden">
        <li className="flex items-center gap-2 text-muted">
          <MapPin size={15} className="text-icon" />
          <span className="font-mono text-[13px]">{profile.homePath}</span>
        </li>
        <li className="flex items-center gap-2">
          <Mail size={15} className="text-icon" />
          <a href={`mailto:${profile.email}`} className="text-fg hover:text-link">
            {profile.email}
          </a>
        </li>
        {linkSocials.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <SocialIcon name={s.icon} size={15} className="text-icon" />
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-fg hover:text-link">
              {s.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-border pt-3 text-sm text-muted max-md:hidden">
        <span className="inline-flex items-center gap-1.5">
          Profile views <PageViews />
        </span>
      </div>
    </aside>
  );
}
