"use client";

import type { Square, Color, PieceSymbol } from "chess.js";

export const GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

type Piece = { color: Color; type: PieceSymbol } | null;

/**
 * Pure board renderer shared by the bot game and the community game.
 * The squares stay dark in both light/dark site themes for piece contrast.
 */
export function ChessBoard({
  board,
  flipped = false,
  selected = null,
  legalTargets,
  lastMove = null,
  onSquareClick,
  disabled = false,
}: {
  board: Piece[][];
  flipped?: boolean;
  selected?: Square | null;
  legalTargets?: Set<Square>;
  lastMove?: { from: Square; to: Square } | null;
  onSquareClick?: (square: Square) => void;
  disabled?: boolean;
}) {
  const rankOrder = flipped ? [...RANKS].reverse() : RANKS;
  const fileOrder = flipped ? [...FILES].reverse() : FILES;

  return (
    <div className="max-w-full overflow-x-auto">
      <div className="inline-block rounded-md border border-border bg-bg p-3">
        <div className="grid grid-cols-8 overflow-hidden rounded">
          {rankOrder.map((rank) =>
            fileOrder.map((file) => {
              const square = `${file}${rank}` as Square;
              const piece = board[8 - rank][FILES.indexOf(file)];
              const isLight = (FILES.indexOf(file) + rank) % 2 === 0;
              const isTarget = legalTargets?.has(square) ?? false;
              const isLast = lastMove && (lastMove.from === square || lastMove.to === square);
              const base = isLight ? "bg-[#2d333b]" : "bg-[#22272e]";
              return (
                <button
                  key={square}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSquareClick?.(square)}
                  aria-pressed={selected === square}
                  aria-label={
                    (piece
                      ? `${square}, ${piece.color === "w" ? "white" : "black"} ${piece.type}`
                      : square) + (isTarget ? ", legal move" : "")
                  }
                  className={`relative flex h-10 w-10 items-center justify-center text-2xl leading-none transition-[filter] sm:h-14 sm:w-14 sm:text-4xl ${base} ${
                    isLast ? "!bg-[#3b4a2a]" : ""
                  } ${selected === square ? "!bg-[#1f6feb]/50" : ""} ${
                    disabled ? "cursor-default" : "hover:brightness-125"
                  }`}
                >
                  {piece && (
                    <span className={piece.color === "w" ? "text-[#f0f6fc]" : "text-[#0a0c10]"}>
                      {GLYPHS[piece.color][piece.type]}
                    </span>
                  )}
                  {isTarget && !piece && (
                    <span className="absolute h-3 w-3 rounded-full bg-[#3fb950]/70" />
                  )}
                  {isTarget && piece && (
                    <span className="absolute inset-1 rounded-full ring-2 ring-[#3fb950]/80" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
