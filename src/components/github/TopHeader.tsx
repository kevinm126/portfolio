"use client";

import Link from "next/link";
import { profile } from "@/content/content";
import { SearchBox } from "./SearchBox";
import { AvatarMenu } from "./AvatarMenu";
import { TabNav, type TabId } from "./TabNav";

export function TopHeader({ activeTab }: { activeTab: TabId }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-header">
      <div className="mx-auto flex max-w-[1216px] items-center justify-between gap-3 px-4 pb-2.5 pt-3 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface font-mono text-sm font-semibold text-fg">
            {profile.initials}
          </span>
          <span className="hidden text-sm text-fg sm:inline">{profile.name}</span>
        </Link>
        <div className="flex items-center gap-3">
          <SearchBox />
          <AvatarMenu />
        </div>
      </div>
      <div className="mx-auto max-w-[1216px] px-4 sm:px-7">
        <TabNav active={activeTab} />
      </div>
    </header>
  );
}
