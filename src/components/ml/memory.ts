/** Doodle Duel's tiny localStorage memory, same shape as the Bother Kev one. */

export type MLMemory = {
  v: 1;
  gamesPlayed: number;
  /** Most rounds the model guessed in a single game. */
  bestWins: number;
};

const KEY = "mlLabMemory";

const fresh = (): MLMemory => ({ v: 1, gamesPlayed: 0, bestWins: 0 });

export function loadMLMemory(): MLMemory {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const m = JSON.parse(raw) as Partial<MLMemory>;
    if (m.v !== 1) return fresh();
    return {
      ...fresh(),
      ...m,
      v: 1,
      gamesPlayed: Math.max(0, Math.round(Number(m.gamesPlayed) || 0)),
      bestWins: Math.max(0, Math.round(Number(m.bestWins) || 0)),
    };
  } catch {
    return fresh(); // private mode etc.
  }
}

export function saveMLMemory(m: MLMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* nothing to be done */
  }
}
