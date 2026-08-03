import type { Metadata } from "next";
import { TopHeader } from "@/components/github/TopHeader";
import { SiteFooter } from "@/components/github/SiteFooter";
import BotherGame from "@/components/bother/BotherGame";

export const metadata: Metadata = {
  title: "Bother Kev",
  description:
    "A tiny office game: throw Kev around all you like — he'll always go back to work. But when he finally snaps, the real Kevin gets a real hurtful email about it.",
};

export default function BotherPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopHeader activeTab="bother" />
      <main className="mx-auto w-full max-w-[1216px] flex-1 px-4 py-6 sm:px-8">
        <h1 className="mb-3 flex items-center gap-2 text-xl font-semibold text-fg">
          Bother Kev <span aria-hidden>🗄️</span>
        </h1>
        <p className="mb-6 max-w-2xl text-sm text-muted">
          One tiny office, one tiny coworker, drawn entirely in code — no sprites, no game engine,
          just a <code className="text-fg">&lt;canvas&gt;</code>{" "}and math. Throw him around all you
          like; he&apos;ll always dust himself off and go back to work. But everything has a limit,
          and when Kev hits his, he opens his email client —{" "}
          <strong className="text-fg">and the real me gets a real, hurtful email about it.</strong>{" "}
          How far you push him is up to you.
        </p>
        <BotherGame />
      </main>
      <SiteFooter />
    </div>
  );
}
