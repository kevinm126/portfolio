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

/** The four things people admit to after a meltdown. */
export type WhyCounts = { funny: number; curious: number; dunno: number; silent: number };

export const EMPTY_WHY: WhyCounts = { funny: 0, curious: 0, dunno: 0, silent: 0 };

/** Rate-limit ledger + confession tally for the Bother Kev pipeline (/api/bother). */
export type BotherState = {
  day: string; // YYYY-MM-DD the counters belong to
  hurtsToday: number;
  apologiesToday: number;
  byIp: Record<
    string,
    { lastHurtAt: number; lastApologyAt: number; hurtsToday: number; lastWhyAt?: number }
  >;
  /** Today's aggregate answers to "why did you do it?" — shown on the whiteboard. */
  why: WhyCounts;
};

type Store = {
  views: number;
  guestbook: GuestEntry[];
  chess: ChessState;
  bother: BotherState;
};

const g = globalThis as unknown as { __portfolioStore?: Store };

if (!g.__portfolioStore) {
  g.__portfolioStore = {
    views: 1284,
    bother: { day: "", hurtsToday: 0, apologiesToday: 0, byIp: {}, why: { ...EMPTY_WHY } },
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
        message: "Clean build. The terminal mode is a great touch!",
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

// Backfill for a store created by an older module version (dev hot-reload).
if (!g.__portfolioStore.bother) {
  g.__portfolioStore.bother = {
    day: "",
    hurtsToday: 0,
    apologiesToday: 0,
    byIp: {},
    why: { ...EMPTY_WHY },
  };
}
if (!g.__portfolioStore.bother.why) {
  g.__portfolioStore.bother.why = { ...EMPTY_WHY };
}

export const store = g.__portfolioStore;
