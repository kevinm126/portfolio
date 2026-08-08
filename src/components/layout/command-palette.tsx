"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  Home,
  Code2,
  Mail,
  MessageSquare,
  FileText,
  BookOpen,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { socials, profile } from "@/content/content";
import { SocialIcon } from "@/components/ui/icons";

export function openCommandPalette() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("cmdk:open"));
}
export function openChat() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("chat:open"));
}

const ROUTES: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Welcome", href: "/", icon: Home },
  { label: "Portfolio", href: "/portfolio", icon: Code2 },
  { label: "Résumé", href: "/resume", icon: FileText },
  { label: "Research Recommendations", href: "/research", icon: BookOpen },
  { label: "Chess", href: "/chess", icon: MessageSquare },
  { label: "Bother Kev", href: "/bother", icon: Briefcase },
  { label: "Get in Touch", href: "/contact", icon: Mail },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "/") {
        const t = e.target as HTMLElement | null;
        const typing =
          !!t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.tagName === "SELECT" ||
            t.isContentEditable);
        if (!typing) {
          e.preventDefault();
          setOpen(true);
        }
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("cmdk:open", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("cmdk:open", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setTimeout(fn, 10);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <Command
        loop
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-md border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search size={16} className="text-icon" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted">No results.</Command.Empty>

          <Command.Group heading="Navigate" className="px-2 py-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
            {ROUTES.map((r) => (
              <Item key={r.href} onSelect={() => run(() => router.push(r.href))}>
                <r.icon size={15} className="text-icon" />
                {r.label}
              </Item>
            ))}
          </Command.Group>

          <Command.Group heading="Actions" className="px-2 py-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
            <Item onSelect={() => run(openChat)}>
              <MessageSquare size={15} className="text-green" />
              Ask Copilot
            </Item>
            <Item onSelect={() => run(() => window.open(profile.resumeUrl, "_blank"))}>
              <FileText size={15} className="text-icon" />
              Download résumé
            </Item>
            <Item onSelect={() => run(() => navigator.clipboard?.writeText(profile.email))}>
              <Mail size={15} className="text-icon" />
              Copy email address
            </Item>
          </Command.Group>

          <Command.Group heading="Links" className="px-2 py-1 text-xs font-medium text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
            {socials.map((s) => (
              <Item key={s.label} onSelect={() => run(() => window.open(s.href, "_blank"))}>
                <SocialIcon name={s.icon} size={15} className="text-icon" />
                {s.label}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-fg aria-selected:bg-btn data-[selected=true]:bg-btn"
    >
      {children}
    </Command.Item>
  );
}
