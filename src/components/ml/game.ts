/**
 * Doodle Duel: pure game logic, kept out of the component so the round rules
 * are readable in one place.
 */

import { WIN_PROB } from "./constants";

export type RoundOutcome = "won" | "timeout" | "skipped";

export type RoundRecord = {
  prompt: string;
  promptIndex: number;
  outcome: RoundOutcome;
  /** Model's top guess when the round ended (label). */
  finalGuess: string | null;
  /** Data URL snapshot of the drawing, for the summary screen. */
  snapshot: string | null;
  secondsLeft: number;
};

/** n distinct prompts for one game, drawn from a pool of label indices. */
export function samplePrompts(pool: number[], n: number, random: () => number = Math.random): number[] {
  const deck = [...pool];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, n);
}

export function topIndices(probs: Float32Array, k: number): number[] {
  const order = [...probs.keys()].sort((a, b) => probs[b] - probs[a]);
  return order.slice(0, k);
}

/** The model "gets it" when the target is its top guess with enough confidence. */
export function isWin(probs: Float32Array, targetIndex: number, winProb: number = WIN_PROB): boolean {
  const [top] = topIndices(probs, 1);
  return top === targetIndex && probs[targetIndex] >= winProb;
}

/** Playful live-ticker line for the current top guesses. */
export function tickerLine(probs: Float32Array, labels: string[]): string {
  const [a, b] = topIndices(probs, 2);
  const pa = probs[a];
  if (pa < 0.15) return "I see... scribbles?";
  if (pa < 0.35) return `Hmm... ${labels[a]}? or maybe ${labels[b]}?`;
  if (pa < 0.6) return `That looks like ${labels[a]}...`;
  return `${labels[a]}!`;
}
