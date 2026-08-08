"use client";

import { useState } from "react";
import { Users, Bot } from "lucide-react";
import ChessGame from "./ChessGame";
import CommunityChess from "./CommunityChess";
import { cn } from "@/lib/utils";

type Mode = "community" | "bot";

export default function ChessModes() {
  const [mode, setMode] = useState<Mode>("community");

  return (
    <div>
      <div className="mb-4 inline-flex rounded-md border border-border bg-surface p-0.5 text-sm">
        <button
          onClick={() => setMode("community")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors",
            mode === "community" ? "bg-btn font-semibold text-fg" : "text-muted hover:text-fg"
          )}
          aria-pressed={mode === "community"}
        >
          <Users size={15} /> Community game
        </button>
        <button
          onClick={() => setMode("bot")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded px-3 py-1.5 transition-colors",
            mode === "bot" ? "bg-btn font-semibold text-fg" : "text-muted hover:text-fg"
          )}
          aria-pressed={mode === "bot"}
        >
          <Bot size={15} /> Play the bot
        </button>
      </div>

      <p className="mb-6 max-w-2xl text-sm text-muted">
        {mode === "community" ? (
          <>
            One shared, never-ending game. The <strong className="text-fg">whole internet</strong>{" "}
            plays White; <strong className="text-fg">I</strong>{" "}answer as Black. Make
            White&apos;s next move and the board locks until I reply, then it&apos;s open again.
            Check back to see how the game evolves.
          </>
        ) : (
          <>You play White against a simple built-in bot. Click a piece, then a highlighted square.</>
        )}
      </p>

      {mode === "community" ? <CommunityChess /> : <ChessGame />}
    </div>
  );
}
