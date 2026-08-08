"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { profile } from "@/content/content";
import { SearchBox } from "./SearchBox";
import { AvatarMenu } from "./AvatarMenu";
import { HireBanner } from "./HireBanner";
import { TabNav, type TabId } from "./TabNav";

export function TopHeader({ activeTab }: { activeTab: TabId }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header">
      <div className="mx-auto flex max-w-[1216px] items-center justify-between gap-3 px-4 pb-2.5 pt-3 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface font-mono text-sm font-semibold text-fg">
              {profile.initials}
            </span>
            <span className="hidden text-sm text-fg sm:inline">{profile.name}</span>
          </Link>
          <Link
            href="/bother"
            className="group inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-coral hover:text-fg"
          >
            <Gamepad2
              size={13}
              className="shrink-0 text-coral transition-transform group-hover:-rotate-12"
              aria-hidden
            />
            <span className="truncate">
              Try my new game
              <span className="hidden md:inline">
                {" — it has "}
                <span className="font-semibold text-coral">real-world consequences</span>
              </span>
            </span>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <SearchBox />
          <AvatarMenu />
        </div>
      </div>
      <div className="mx-auto max-w-[1216px] px-4 sm:px-7">
        <TabNav active={activeTab} />
      </div>
      <HireBanner />
    </header>
  );
}
