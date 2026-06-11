"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { profile, socials } from "@/content/content";
import { cn } from "@/lib/utils";
import { useTheme } from "@/app/providers";

const ITEMS = [
  { label: "Welcome", href: "/" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Research", href: "/research" },
  { label: "Chess", href: "/chess" },
  { label: "Get in Touch", href: "/contact" },
];

export function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const github = socials.find((s) => s.icon === "github")?.href;
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-0.5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar}
          alt=""
          className="h-8 w-8 rounded-full border border-border bg-surface object-cover"
        />
        <ChevronDown size={13} className="text-icon" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.avatar} alt="" className="h-7 w-7 rounded-full border border-border" />
            <div className="text-sm">
              <div className="font-semibold text-fg">{profile.name}</div>
              <div className="text-xs text-muted">@{profile.handle}</div>
            </div>
          </div>
          <div className="py-1">
            {ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn("block px-3 py-1.5 text-sm text-fg hover:bg-btn")}
              >
                {it.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-1.5 text-left text-sm text-fg hover:bg-btn"
            >
              {theme === "dark" ? (
                <Sun size={15} className="text-icon" />
              ) : (
                <Moon size={15} className="text-icon" />
              )}
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
            {github && (
              <a
                href={github}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-t border-border px-3 py-1.5 text-sm text-muted hover:bg-btn"
              >
                GitHub ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
