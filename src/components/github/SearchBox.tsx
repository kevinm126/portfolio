"use client";

import { Search } from "lucide-react";
import { openCommandPalette } from "@/components/layout/command-palette";

export function SearchBox() {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      aria-label="Search"
      className="flex h-9 items-center gap-2 rounded-md border border-border bg-transparent px-2.5 text-sm text-muted transition-colors hover:border-icon sm:w-[240px]"
    >
      <Search size={15} />
      <span className="hidden sm:inline">Type to search</span>
      <kbd className="ml-auto hidden rounded border border-border px-1 font-mono text-xs text-icon sm:inline">
        /
      </kbd>
    </button>
  );
}
