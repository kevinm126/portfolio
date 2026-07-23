"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { ChessBoard } from "./ChessBoard";

type Snapshot = {
  fen: string;
  history: string[];
  turn: "w" | "b";
  sideToMove: "community" | "kevin";
  locked: boolean;
  gameOver: boolean;
  status: string;
  result: string | null;
  lastMoveBy: "community" | "kevin" | null;
  lastMoveAt: string | null;
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CommunityChess() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const submitting = useRef(false);

  const isAdmin = adminKey.length > 0;

  // Fen of the last applied snapshot, so a stale selection can be cleared
  // without reading `snap` inside stable callbacks.
  const appliedFen = useRef<string | null>(null);

  const applySnapshot = useCallback((data: Snapshot) => {
    if (appliedFen.current && appliedFen.current !== data.fen) setSelected(null);
    appliedFen.current = data.fen;
    setSnap(data);
  }, []);

  const load = useCallback(async () => {
    if (submitting.current) return;
    try {
      const res = await fetch("/api/chess", { cache: "no-store" });
      const data = (await res.json()) as Snapshot;
      applySnapshot(data);
    } catch {
      /* transient — next poll will retry */
    }
  }, [applySnapshot]);

  // Pick up the admin key from ?admin=… once, then strip it from the URL.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const q = url.searchParams.get("admin");
      if (q) {
        localStorage.setItem("chessAdminKey", q);
        url.searchParams.delete("admin");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time post-hydration read; during render it would mismatch the server HTML
      setAdminKey(localStorage.getItem("chessAdminKey") || "");
    } catch {
      /* ignore */
    }
  }, []);

  // Initial load + polling + refresh on focus.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load() is async; state updates only after the fetch resolves
    load();
    const id = setInterval(load, 5000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  const game = useMemo(() => (snap ? new Chess(snap.fen) : null), [snap]);

  const canMove =
    !!snap &&
    !snap.gameOver &&
    (snap.turn === "w" || (snap.turn === "b" && isAdmin));

  const legalTargets = useMemo(() => {
    if (!game || !selected) return new Set<Square>();
    return new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to as Square));
  }, [game, selected]);

  const submitMove = useCallback(
    async (from: Square, to: Square) => {
      if (!snap) return;
      submitting.current = true;
      setError(null);
      const prevFen = snap.fen;
      try {
        const res = await fetch("/api/chess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to,
            promotion: "q",
            expectedFen: prevFen,
            admin: adminKey || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Move rejected.");
          if (data.fen) applySnapshot(data as Snapshot);
        } else {
          applySnapshot(data as Snapshot);
        }
      } catch {
        setError("Network error — try again.");
      } finally {
        setSelected(null);
        submitting.current = false;
      }
    },
    [snap, adminKey, applySnapshot]
  );

  const onSquareClick = useCallback(
    (square: Square) => {
      if (!game || !canMove || submitting.current) return;
      const piece = game.get(square);
      if (selected && legalTargets.has(square)) {
        submitMove(selected, square);
        return;
      }
      if (piece && piece.color === game.turn()) setSelected(square === selected ? null : square);
      else setSelected(null);
    },
    [game, canMove, selected, legalTargets, submitMove]
  );

  const resetGame = useCallback(async () => {
    if (!isAdmin) return;
    submitting.current = true;
    try {
      const res = await fetch("/api/chess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", admin: adminKey }),
      });
      const data = await res.json();
      if (res.ok) applySnapshot(data as Snapshot);
      else setError(data.error || "Could not reset.");
    } finally {
      submitting.current = false;
      setSelected(null);
    }
  }, [isAdmin, adminKey, applySnapshot]);

  const signOutAdmin = useCallback(() => {
    try {
      localStorage.removeItem("chessAdminKey");
    } catch {
      /* ignore */
    }
    setAdminKey("");
  }, []);

  if (!snap || !game) {
    return <p className="text-sm text-muted">Loading the shared game…</p>;
  }

  const history = snap.history;
  const lastMove =
    history.length > 0
      ? (() => {
          // derive the from/to of the last move by replaying — cheap for short games
          const replay = new Chess();
          let mv: { from: string; to: string } | null = null;
          for (const san of history) {
            const m = replay.move(san);
            if (m) mv = { from: m.from, to: m.to };
          }
          return mv ? { from: mv.from as Square, to: mv.to as Square } : null;
        })()
      : null;

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      <ChessBoard
        board={game.board()}
        flipped={flipped}
        selected={selected}
        legalTargets={legalTargets}
        lastMove={lastMove}
        onSquareClick={onSquareClick}
        disabled={!canMove}
      />

      <div className="flex w-full max-w-xs flex-col gap-3 text-fg">
        <p className="text-sm font-medium">{snap.status}</p>

        {/* contextual instruction */}
        {snap.gameOver ? (
          <p className="text-xs text-muted">
            This game has ended{snap.result ? ` (${snap.result})` : ""}.
            {isAdmin ? " Start a new one below." : " Check back soon for a new game."}
          </p>
        ) : snap.turn === "w" ? (
          <p className="text-xs text-muted">
            Your move — you&apos;re playing the community&apos;s <strong>White</strong>{" "}pieces.
            Click a piece, then a highlighted square.
          </p>
        ) : isAdmin ? (
          <p className="text-xs text-coral">
            You&apos;re signed in as Kevin — play <strong>Black&apos;s</strong>{" "}reply.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-xs text-muted">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-coral" />
            Locked — waiting for Kevin to reply as Black.
          </p>
        )}

        {error && <p className="text-xs text-coral">{error}</p>}

        {snap.lastMoveBy && (
          <p className="text-xs text-muted">
            Last move by {snap.lastMoveBy === "kevin" ? "Kevin" : "the community"} ·{" "}
            {timeAgo(snap.lastMoveAt)}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setFlipped((f) => !f)}
            className="rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover"
          >
            Flip
          </button>
          {isAdmin && (
            <button
              onClick={resetGame}
              className="rounded-md border border-border bg-btn px-3 py-1.5 text-sm hover:bg-btn-hover"
            >
              New game
            </button>
          )}
        </div>

        {isAdmin && (
          <p className="flex items-center gap-1.5 text-xs text-coral">
            <ShieldCheck size={13} /> Admin mode
            <button onClick={signOutAdmin} className="ml-1 text-muted underline hover:text-fg">
              sign out
            </button>
          </p>
        )}

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
