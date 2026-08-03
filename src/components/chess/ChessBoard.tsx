"use client";

import type { Square, Color, PieceSymbol } from "chess.js";

export const GLYPHS: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" },
};
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;

type Piece = { color: Color; type: PieceSymbol } | null;

// Solid glyphs for BOTH sides (colored via CSS) — uniform visual weight,
// unlike the hollow white-piece codepoints which render thin and wiry.
// U+FE0E forces text presentation: without it, ♟ (U+265F) renders as a color
// emoji on Apple platforms and ignores CSS color entirely.
const SOLID: Record<PieceSymbol, string> = {
  k: "♚︎",
  q: "♛︎",
  r: "♜︎",
  b: "♝︎",
  n: "♞︎",
  p: "♟︎",
};

/**
 * Pure board renderer shared by the bot game and the community game.
 * Classic tournament-green palette, fixed across site themes: familiar,
 * high square contrast, and pieces carry their own outline shadows.
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
              const isSelected = selected === square;
              const base = isLight ? "bg-[#ebecd0]" : "bg-[#779556]";
              const highlight =
                isSelected || isLast ? (isLight ? "!bg-[#f5f682]" : "!bg-[#b9ca43]") : "";
              // Coordinates on the board edge, lichess-style.
              const showRank = file === fileOrder[0];
              const showFile = rank === rankOrder[rankOrder.length - 1];
              const coordColor = isLight ? "text-[#779556]" : "text-[#ebecd0]";
              return (
                <button
                  key={square}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSquareClick?.(square)}
                  aria-pressed={isSelected}
                  aria-label={
                    (piece
                      ? `${square}, ${piece.color === "w" ? "white" : "black"} ${piece.type}`
                      : square) + (isTarget ? ", legal move" : "")
                  }
                  className={`relative flex h-10 w-10 items-center justify-center text-[27px] leading-none transition-[filter] sm:h-14 sm:w-14 sm:text-[40px] ${base} ${highlight} ${
                    isSelected ? "shadow-[inset_0_0_0_2px_rgba(255,255,255,0.65)]" : ""
                  } ${disabled ? "cursor-default" : "hover:brightness-105"}`}
                >
                  {showRank && (
                    <span
                      className={`pointer-events-none absolute left-0.5 top-0.5 select-none text-[8px] font-semibold leading-none sm:text-[10px] ${coordColor}`}
                    >
                      {rank}
                    </span>
                  )}
                  {showFile && (
                    <span
                      className={`pointer-events-none absolute bottom-0.5 right-1 select-none text-[8px] font-semibold leading-none sm:text-[10px] ${coordColor}`}
                    >
                      {file}
                    </span>
                  )}
                  {piece && (
                    <span
                      className={
                        piece.color === "w"
                          ? "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]"
                          : "text-[#312e2b] [text-shadow:0_1px_1.5px_rgba(255,255,255,0.25)]"
                      }
                    >
                      {SOLID[piece.type]}
                    </span>
                  )}
                  {isTarget && !piece && (
                    <span className="absolute h-3 w-3 rounded-full bg-black/20 sm:h-4 sm:w-4" />
                  )}
                  {isTarget && piece && (
                    <span className="absolute inset-0.5 rounded-full ring-[3px] ring-black/25" />
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
