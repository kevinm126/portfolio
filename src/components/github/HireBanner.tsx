import Link from "next/link";
import { FileText, Mail } from "lucide-react";
import { profile } from "@/content/content";

/**
 * The recruiter fast lane: one thin site-wide strip that answers "what is he
 * looking for, when, and where's the résumé" before anything else loads into
 * the visitor's attention. Rendered by TopHeader on every page.
 */
export function HireBanner() {
  return (
    <div className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1216px] items-center gap-2.5 px-4 py-1.5 text-xs sm:px-7">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
        </span>
        <p className="min-w-0 truncate text-muted">
          <span className="font-semibold text-fg">{profile.availability.status}</span>
          <span className="hidden sm:inline">{" · "}{profile.availability.facts}</span>
        </p>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            href="/resume"
            className="inline-flex items-center gap-1 font-medium text-link hover:underline"
          >
            <FileText size={12} aria-hidden />
            Résumé
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 font-medium text-link hover:underline"
          >
            <Mail size={12} aria-hidden />
            Contact
          </Link>
        </span>
      </div>
    </div>
  );
}
