"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Home, Code2, Mail, BookOpen, Briefcase, FileText, MoreHorizontal, type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabId = "welcome" | "portfolio" | "resume" | "research" | "chess" | "bother" | "contact";

function PawnIcon(props: LucideProps) {
  const { size = 16, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 2a3.2 3.2 0 0 0-1.9 5.78c-.9.5-1.5 1.45-1.5 2.55 0 1.02.52 1.92 1.3 2.46-.5 1.5-1.4 3-2.7 4.21-.5.46-.2 1.24.48 1.24h8.64c.68 0 .98-.78.48-1.24-1.3-1.2-2.2-2.7-2.7-4.2a2.98 2.98 0 0 0 1.3-2.47c0-1.1-.6-2.05-1.5-2.55A3.2 3.2 0 0 0 12 2ZM6.5 20.5c0-.55.45-1 1-1h9c.55 0 1 .45 1 1v.5c0 .55-.45 1-1 1h-9c-.55 0-1-.45-1-1v-.5Z" />
    </svg>
  );
}

type Tab = { id: TabId; label: string; href: string; Icon: React.ComponentType<LucideProps> };

const TABS: Tab[] = [
  { id: "welcome", label: "Welcome", href: "/", Icon: Home },
  { id: "portfolio", label: "Portfolio", href: "/portfolio", Icon: Code2 },
  { id: "resume", label: "Résumé", href: "/resume", Icon: FileText },
  { id: "research", label: "Research Recommendations", href: "/research", Icon: BookOpen },
  { id: "chess", label: "Chess", href: "/chess", Icon: PawnIcon },
  { id: "bother", label: "Bother Kev", href: "/bother", Icon: Briefcase },
  { id: "contact", label: "Get in Touch", href: "/contact", Icon: Mail },
];

/** Tabs always visible; the rest collapse into "..." on small screens. The
 *  résumé tab stays visible everywhere — it's the one recruiters came for.
 *  The 960px cutoff is measured, not guessed: the seven-tab row needs 893px
 *  of content width plus ~67px of container padding, and at 240px "Research
 *  Recommendations" is more than twice the width of any other tab. Shorten
 *  that label and the cutoff can come back down (it was 808px). */
const ALWAYS_VISIBLE = 3;

export function TabNav({ active }: { active: TabId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  const overflow = TABS.slice(ALWAYS_VISIBLE);
  const overflowActive = overflow.some((t) => t.id === active);

  return (
    <nav className="flex items-stretch">
      {TABS.map((t, i) => (
        <Link
          key={t.id}
          href={t.href}
          className={cn(
            "relative shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-3 pt-1 text-sm transition-colors",
            i >= ALWAYS_VISIBLE ? "hidden min-[960px]:flex" : "flex",
            active === t.id ? "font-semibold text-fg" : "text-muted hover:text-fg"
          )}
        >
          <t.Icon size={16} className="text-icon" />
          <span>{t.label}</span>
          {active === t.id && (
            <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-coral" />
          )}
        </Link>
      ))}

      {/* overflow menu (small screens) */}
      <div ref={ref} className="relative flex min-[960px]:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label="More tabs"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "relative flex items-center px-3 pb-3 pt-1 text-sm",
            overflowActive ? "text-fg" : "text-muted hover:text-fg"
          )}
        >
          <MoreHorizontal size={18} />
          {overflowActive && (
            <span className="absolute inset-x-2 -bottom-px h-[2px] rounded bg-coral" />
          )}
        </button>
        {open && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="More tabs"
            onKeyDown={onMenuKeyDown}
            className="absolute right-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-surface py-1 shadow-2xl"
          >
            {overflow.map((t) => (
              <Link
                key={t.id}
                href={t.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm hover:bg-btn",
                  active === t.id ? "font-semibold text-fg" : "text-muted"
                )}
              >
                <t.Icon size={16} className="text-icon" />
                {t.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
