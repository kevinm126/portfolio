/**
 * Process-local in-memory store for the guestbook + view counter.
 * Good enough for local dev and a single-instance deploy. For durable,
 * multi-instance persistence on Vercel, swap to Upstash Redis or Postgres —
 * see SETUP.md ("Guestbook & views").
 */

export type GuestEntry = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

/** One shared correspondence game: the community plays White, Kevin plays Black. */
export type ChessState = {
  fen: string;
  history: string[]; // SAN moves, in order
  lastMoveAt: string | null;
  lastMoveBy: "community" | "kevin" | null;
  result: string | null; // null while ongoing
};

export const CHESS_START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

type Store = { views: number; guestbook: GuestEntry[]; chess: ChessState };

const g = globalThis as unknown as { __portfolioStore?: Store };

if (!g.__portfolioStore) {
  g.__portfolioStore = {
    views: 1284,
    chess: {
      fen: CHESS_START_FEN,
      history: [],
      lastMoveAt: null,
      lastMoveBy: null,
      result: null,
    },
    guestbook: [
      {
        id: "seed-3",
        name: "Ada",
        message: "Clean build — the terminal mode is a great touch!",
        createdAt: "2026-05-22T14:10:00.000Z",
      },
      {
        id: "seed-2",
        name: "Grace",
        message: "Loved the case studies. Those metrics tell a story.",
        createdAt: "2026-05-18T09:30:00.000Z",
      },
      {
        id: "seed-1",
        name: "Linus",
        message: "Nice work. Bookmarked.",
        createdAt: "2026-05-15T20:05:00.000Z",
      },
    ],
  };
}

export const store = g.__portfolioStore;
