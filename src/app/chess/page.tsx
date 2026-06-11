import type { Metadata } from "next";
import { TopHeader } from "@/components/github/TopHeader";
import { SiteFooter } from "@/components/github/SiteFooter";
import ChessModes from "@/components/chess/ChessModes";

export const metadata: Metadata = {
  title: "Chess",
  description:
    "Play a shared community game of chess against Kevin, or take on a built-in bot.",
};

export default function ChessPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab="chess" />
      <main className="mx-auto w-full max-w-[1216px] flex-1 px-4 py-6 sm:px-8">
        <h1 className="mb-3 flex items-center gap-2 text-xl font-semibold text-fg">
          Play Chess <span aria-hidden>♟</span>
        </h1>
        <ChessModes />
      </main>
      <SiteFooter />
    </div>
  );
}
