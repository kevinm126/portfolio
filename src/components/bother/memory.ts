/**
 * Bother Kev — what he remembers about *you*, persisted in localStorage.
 *
 * The spine of every "he knows me" feature is one hidden scalar: `trust`
 * (-100..100). Nothing in the UI ever shows the number — the player only
 * ever sees its symptoms (greetings, flinches, the stare).
 */

export type WhyAnswer = "funny" | "curious" | "dunno" | "silent";

export type KevMemory = {
  v: 1;
  /** Completed visits (incremented once per session on load). */
  visits: number;
  trust: number; // -100..100
  lifetimeIncidents: number;
  meltdowns: number;
  apologies: number;
  mugsBroken: number;
  cablePulls: number;
  /** Spreadsheet progress — his life's work survives the tab closing. */
  rows: number;
  /** How many full sheets he has ever finished. Names the next one. */
  sheetsDone: number;
  /** The player's latest answer to "why did you do it?" */
  lastWhy: WhyAnswer | null;
  /** He apologizes for flinching only once, ever. */
  flinchSaid: boolean;
  lastVisitAt: number; // ms epoch
};

export const ROWS_TARGET = 9880;

const KEY = "botherKevMemory";

const fresh = (): KevMemory => ({
  v: 1,
  visits: 0,
  trust: 0,
  lifetimeIncidents: 0,
  meltdowns: 0,
  apologies: 0,
  mugsBroken: 0,
  cablePulls: 0,
  rows: 0,
  sheetsDone: 0,
  lastWhy: null,
  flinchSaid: false,
  lastVisitAt: 0,
});

export function loadMemory(): KevMemory {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const m = JSON.parse(raw) as Partial<KevMemory>;
    if (m.v !== 1) return fresh();
    const base = fresh();
    return {
      ...base,
      ...m,
      v: 1,
      trust: clampTrust(Number(m.trust) || 0),
      rows: Math.min(Math.max(Math.round(Number(m.rows) || 0), 0), ROWS_TARGET),
    };
  } catch {
    return fresh(); // private mode etc. — he just starts over, every time
  }
}

export function saveMemory(m: KevMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* nothing to be done — he won't remember */
  }
}

/** "He won't remember any of it. You will." */
export function wipeMemory() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const clampTrust = (t: number) => Math.min(100, Math.max(-100, t));

/** Trust deltas for everything that can happen to him. */
export const TRUST = {
  incident: -1,
  mugBreak: -5,
  meltdown: -15,
  cablePull: -25,
  apology: +10,
  peacefulMinute: +2,
} as const;

/** Greeting buckets. `null` line means he only looks (the stare handles it). */
export function greetingFor(m: KevMemory): { line: string | null; mood: "happy" | "worried" | null } {
  if (m.visits <= 1) return { line: null, mood: null }; // strangers get no history
  if (m.trust >= 30) return { line: "oh. it's you. good.", mood: "happy" };
  if (m.trust >= -20) return { line: "…you're back.", mood: null };
  if (m.trust >= -60) return { line: "you're back.", mood: "worried" };
  return { line: null, mood: "worried" }; // beyond words — he just watches you arrive
}

/** Cursor-approach flinch thresholds. */
export const FLINCH_TRUST = -15; // below this, fast approaches make him duck
export const FLINCH_TRUST_BAD = -50; // below this, even slow ones do
