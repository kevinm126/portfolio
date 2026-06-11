"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square, type PieceSymbol } from "chess.js";
import { ChessBoard } from "./ChessBoard";

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
type BotLevel = "random" | "greedy" | "minimax";

function pickBotMove(fen: string, level: BotLevel) {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  const toUci = (m: (typeof moves)[number]) => ({
    from: m.from as Square,
    to: m.to as Square,
    promotion: m.promotion ? ("q" as const) : undefined,
  });
  if (level === "random") return toUci(moves[Math.floor(Math.random() * moves.length)]);
  if (level === "greedy") {
    let best = moves[0];
    let bestGain = -1;
    for (const m of moves) {
      const gain = m.captured ? VALUE[m.captured] : 0;
      if (gain > bestGain || (gain === bestGain && Math.random() < 0.3)) {
        bestGain = gain;
        best = m;
      }
    }
    return toUci(best);
  }
  const evaluate = (g: Chess) => {
    let s = 0;
    for (const row of g.board())
      for (const sq of row) if (sq) s += (sq.color === "b" ? 1 : -1) * VALUE[sq.type];
    return s;
  };
  const negamax = (g: Chess, depth: number, color: 1 | -1): number => {
    if (depth === 0 || g.isGameOver()) {
      if (g.isCheckmate()) return -99999 * color;
      return color * evaluate(g);
    }
    let best = -Infinity;
    for (const mv of g.moves({ verbose: true })) {
      g.move({ from: mv.from, to: mv.to, promotion: mv.promotion ? "q" : undefined });
      best = Math.max(best, -negamax(g, depth - 1, (color * -1) as 1 | -1));
      g.undo();
    }
    return best;
  };
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    game.move({ from: m.from, to: m.to, promotion: m.promotion ? "q" : undefined });
    const score = -negamax(game, 1, -1);
    game.undo();
    if (score > bestScore || (score === bestScore && Math.random() < 0.3)) {
      bestScore = score;
      best = m;
    }
  }
  return toUci(best);
}

export default function ChessGame() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [fen, setFen] = useState(game.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [botLevel, setBotLevel] = useState<BotLevel>("greedy");
  const thinkingRef = useRef(false);
  const sync = useCallback(() => setFen(game.fen()), [game]);

  const legalTargets = useMemo(() => {
    if (!selected) return new Set<Square>();
    return new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to as Square));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, fen, game]);

  const makeMove = useCallback(
    (from: Square, to: Square) => {
      const target = game.moves({ square: from, verbose: true }).find((m) => m.to === to);
      if (!target) return false;
      try {
        game.move({ from, to, promotion: target.promotion ? "q" : undefined });
      } catch {
        return false;
      }
      setLastMove({ from, to });
      setSelected(null);
      sync();
      return true;
    },
    [game, sync]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (game.isGameOver() || game.turn() !== "w") return;
      const piece = game.get(square);
      if (selected && legalTargets.has(square)) {
        makeMove(selected, square);
        return;
      }
      if (piece && piece.color === "w") setSelected(square === selected ? null : square);
      else setSelected(null);
    },
    [game, selected, legalTargets, makeMove]
  );

  useEffect(() => {
    if (game.turn() !== "b" || game.isGameOver() || thinkingRef.current) return;
    thinkingRef.current = true;
    const id = setTimeout(() => {
      const mv = pickBotMove(game.fen(), botLevel);
      if (mv) {
        try {
          game.move(mv);
          setLastMove({ from: mv.from, to: mv.to });
          sync();
        } catch {}
      }
      thinkingRef.current = false;
    }, 350);
    return () => {
      clearTimeout(id);
      thinkingRef.current = false;
    };
  }, [fen, botLevel, game, sync]);

  const newGame = useCallback(() => {
    game.reset();
    setSelected(null);
    setLastMove(null);
    thinkingRef.current = false;
    sync();
  }, [game, sync]);

  const undo = useCallback(() => {
    game.undo(); // undo the bot's reply
    if (game.turn() !== "w") game.undo(); // and the player's move, so it's White to move again
    setSelected(null);
    setLastMove(null);
    thinkingRef.current = false;
    sync();
  }, [game, sync]);

  const status = useMemo(() => {
    if (game.isCheckmate()) return `Checkmate — ${game.turn() === "w" ? "Black" : "White"} wins`;
    if (game.isStalemate()) return "Draw — stalemate";
    if (game.isDraw()) return "Draw";
    return `${game.turn() === "w" ? "White" : "Black"} to move${game.inCheck() ? " — check" : ""}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, game]);

  const history = game.history();
  const board = game.board();

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <ChessBoard
        board={board}
        flipped={flipped}
        selected={selected}
        legalTargets={legalTargets}
        lastMove={lastMove}
        onSquareClick={onSquareClick}
      />

      <div className="flex w-full max-w-xs flex-col gap-3 text-fg">
        <p className="text-sm font-medium">{status}</p>
        <p className="text-xs text-muted">You play White. The bot replies as Black.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={newGame} className="rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover">
            New game
          </button>
          <button
            onClick={undo}
            disabled={!history.length}
            className="rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover disabled:opacity-40"
          >
            Undo
          </button>
          <button onClick={() => setFlipped((f) => !f)} className="rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover">
            Flip
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm">
          Bot:
          <select
            value={botLevel}
            onChange={(e) => setBotLevel(e.target.value as BotLevel)}
            aria-label="Bot difficulty"
            className="rounded-md border border-border bg-bg px-2 py-1 text-sm"
          >
            <option value="random">Random</option>
            <option value="greedy">Greedy</option>
            <option value="minimax">Minimax (d2)</option>
          </select>
        </label>
        <ol className="grid max-h-72 grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-0.5 overflow-y-auto rounded-md border border-border bg-bg p-2 text-sm tabular-nums">
          {history.length === 0 && <li className="col-span-3 text-muted">No moves yet.</li>}
          {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
            <li key={i} className="contents">
              <span className="text-muted">{i + 1}.</span>
              <span>{history[i * 2]}</span>
              <span>{history[i * 2 + 1] ?? ""}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
