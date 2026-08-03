import { Chess } from "chess.js";
import { store, CHESS_START_FEN } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * One shared correspondence game.
 *   • The community plays White — anyone can make White's move.
 *   • Kevin plays Black — those moves require the admin key, so the board
 *     stays locked to the public until he replies.
 * Set CHESS_ADMIN_KEY in the environment for production; the dev fallback
 * below only exists so the feature is playable locally.
 */
const ADMIN_KEY = process.env.CHESS_ADMIN_KEY || "kevin-dev";

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

function statusText(game: Chess): string {
  if (game.isCheckmate()) {
    // The side to move has been mated, so the other side won.
    return game.turn() === "w"
      ? "Checkmate — I win as Black"
      : "Checkmate — the community (White) wins";
  }
  if (game.isStalemate()) return "Draw — stalemate";
  if (game.isInsufficientMaterial()) return "Draw — insufficient material";
  if (game.isThreefoldRepetition()) return "Draw — threefold repetition";
  if (game.isDraw()) return "Draw";
  const side = game.turn() === "w" ? "White (community)" : "Black (me)";
  return `${side} to move${game.inCheck() ? " — check" : ""}`;
}

function snapshot(): Snapshot {
  const c = store.chess;
  const game = new Chess(c.fen);
  const turn = game.turn();
  return {
    fen: c.fen,
    history: c.history,
    turn,
    sideToMove: turn === "w" ? "community" : "kevin",
    locked: turn === "b",
    gameOver: game.isGameOver(),
    status: statusText(game),
    result: c.result,
    lastMoveBy: c.lastMoveBy,
    lastMoveAt: c.lastMoveAt,
  };
}

export async function GET() {
  return Response.json(snapshot());
}

export async function POST(req: Request) {
  let data: {
    from?: string;
    to?: string;
    promotion?: string;
    admin?: string;
    action?: string;
    expectedFen?: string;
  } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const isAdmin = typeof data.admin === "string" && data.admin === ADMIN_KEY;

  // Admin: start a fresh game.
  if (data.action === "reset") {
    if (!isAdmin) {
      return Response.json({ error: "Only I can start a new game — nice try though." }, { status: 403 });
    }
    store.chess = {
      fen: CHESS_START_FEN,
      history: [],
      lastMoveAt: null,
      lastMoveBy: null,
      result: null,
    };
    return Response.json(snapshot());
  }

  const game = new Chess(store.chess.fen);

  if (game.isGameOver()) {
    return Response.json({ error: "Game over.", ...snapshot() }, { status: 409 });
  }

  // Guard against a stale client view (someone else moved first).
  if (data.expectedFen && data.expectedFen !== store.chess.fen) {
    return Response.json({ error: "The board changed — refreshed.", ...snapshot() }, { status: 409 });
  }

  const turn = game.turn();
  // Black is Kevin's side and requires the admin key.
  if (turn === "b" && !isAdmin) {
    return Response.json(
      { error: "It's my move — the board is locked until I reply.", ...snapshot() },
      { status: 403 }
    );
  }

  const from = (data.from ?? "").toString();
  const to = (data.to ?? "").toString();
  if (!from || !to) {
    return Response.json({ error: "Missing move." }, { status: 400 });
  }

  // Validate against the legal move list for this square.
  const legal = game.moves({ verbose: true }).find((m) => m.from === from && m.to === to);
  if (!legal) {
    return Response.json({ error: "Illegal move.", ...snapshot() }, { status: 400 });
  }

  try {
    game.move({ from, to, promotion: legal.promotion ? "q" : undefined });
  } catch {
    return Response.json({ error: "Illegal move.", ...snapshot() }, { status: 400 });
  }

  store.chess.fen = game.fen();
  store.chess.history = [...store.chess.history, legal.san];
  store.chess.lastMoveBy = turn === "w" ? "community" : "kevin";
  store.chess.lastMoveAt = new Date().toISOString();

  if (game.isGameOver()) {
    store.chess.result = game.isCheckmate()
      ? game.turn() === "w"
        ? "0-1"
        : "1-0"
      : "½-½";
  }

  return Response.json(snapshot());
}
