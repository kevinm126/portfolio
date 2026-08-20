"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROUNDS_PER_GAME, ROUND_SECONDS } from "./constants";
import { DigitCanvas, type DigitCanvasHandle } from "./DigitCanvas";
import { isWin, samplePrompts, tickerLine, topIndices, type RoundRecord } from "./game";
import { loadMLMemory, saveMLMemory } from "./memory";
import { DOODLES } from "./metrics";
import { useLivePrediction } from "./useLivePrediction";
import { useModel } from "./useModel";
import { BTN_PRIMARY, BTN_SECONDARY } from "./ui";
import { cn } from "@/lib/utils";

type Phase = "idle" | "playing" | "roundEnd" | "summary";
type Mode = "game" | "free";

const ROUND_END_MS = 1600;

export function DoodleGame() {
  const { status, model, retry } = useModel("doodles");
  const canvasRef = useRef<DigitCanvasHandle | null>(null);
  const { probs, field, onDirty, onSettle } = useLivePrediction(canvasRef, model, DOODLES.preprocess);

  const [mode, setMode] = useState<Mode>("game");
  const [phase, setPhase] = useState<Phase>("idle");
  const [prompts, setPrompts] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<RoundRecord[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [bestWins, setBestWins] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");

  const deadlineRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");
  useEffect(() => {
    phaseRef.current = phase;
  });

  useEffect(() => {
    const t = setTimeout(() => setBestWins(loadMLMemory().bestWins), 0);
    return () => clearTimeout(t);
  }, []);

  const target = phase === "playing" || phase === "roundEnd" ? prompts[round] : undefined;

  const startGame = useCallback(() => {
    canvasRef.current?.clear();
    setPrompts(samplePrompts(DOODLES.labels, ROUNDS_PER_GAME));
    setResults([]);
    setRound(0);
    setSecondsLeft(ROUND_SECONDS);
    deadlineRef.current = performance.now() + ROUND_SECONDS * 1000;
    setPhase("playing");
  }, []);

  const endRound = useCallback(
    (outcome: RoundRecord["outcome"]) => {
      if (phaseRef.current !== "playing") return;
      const promptIndex = prompts[round];
      const guessIdx = probs ? topIndices(probs, 1)[0] : null;
      setResults((rs) => [
        ...rs,
        {
          prompt: DOODLES.labels[promptIndex],
          promptIndex,
          outcome,
          finalGuess: guessIdx !== null ? DOODLES.labels[guessIdx] : null,
          snapshot: canvasRef.current?.snapshot() ?? null,
          secondsLeft: Math.max(0, Math.round((deadlineRef.current - performance.now()) / 1000)),
        },
      ]);
      setPhase("roundEnd");
      setAnnounce(
        outcome === "won"
          ? `The model guessed ${DOODLES.labels[promptIndex]}.`
          : outcome === "timeout"
            ? "Time is up."
            : "Skipped.",
      );
    },
    [prompts, round, probs],
  );

  // Advance out of the round-end splash.
  useEffect(() => {
    if (phase !== "roundEnd") return;
    const t = setTimeout(() => {
      canvasRef.current?.clear();
      if (round + 1 >= ROUNDS_PER_GAME) {
        setPhase("summary");
      } else {
        setRound((r) => r + 1);
        setSecondsLeft(ROUND_SECONDS);
        deadlineRef.current = performance.now() + ROUND_SECONDS * 1000;
        setPhase("playing");
      }
    }, ROUND_END_MS);
    return () => clearTimeout(t);
  }, [phase, round]);

  // Announce each new prompt.
  useEffect(() => {
    if (phase !== "playing" || target === undefined) return;
    const t = setTimeout(
      () => setAnnounce(`Round ${round + 1}. Draw: ${DOODLES.labels[target]}. ${ROUND_SECONDS} seconds.`),
      0,
    );
    return () => clearTimeout(t);
  }, [phase, round, target]);

  // Countdown clock.
  useEffect(() => {
    if (phase !== "playing") return;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadlineRef.current - performance.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) endRound("timeout");
    }, 100);
    return () => clearInterval(iv);
  }, [phase, endRound]);

  // Win check on every fresh prediction.
  useEffect(() => {
    if (phase !== "playing" || !probs || target === undefined) return;
    if (!isWin(probs, target)) return;
    const t = setTimeout(() => endRound("won"), 0);
    return () => clearTimeout(t);
  }, [phase, probs, target, endRound]);

  // Record the finished game once.
  useEffect(() => {
    if (phase !== "summary") return;
    const t = setTimeout(() => {
      const wins = results.filter((r) => r.outcome === "won").length;
      const m = loadMLMemory();
      m.gamesPlayed += 1;
      m.bestWins = Math.max(m.bestWins, wins);
      saveMLMemory(m);
      setBestWins(m.bestWins);
      setAnnounce(`Game over. The model guessed ${wins} of ${ROUNDS_PER_GAME} drawings.`);
    }, 0);
    return () => clearTimeout(t);
  }, [phase, results]);

  const switchMode = useCallback((next: Mode) => {
    setMode(next);
    setPhase("idle");
    canvasRef.current?.clear();
  }, []);

  const wins = results.filter((r) => r.outcome === "won").length;
  const lastResult = results[results.length - 1];
  const canvasDisabled = status !== "ready" || (mode === "game" && phase !== "playing");

  return (
    <section aria-labelledby="doodle-duel-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="doodle-duel-heading" className="text-lg font-semibold text-fg">
          Doodle Duel
        </h2>
        <div className="inline-flex rounded-md border border-border bg-surface p-0.5" role="group" aria-label="Doodle mode">
          {(["game", "free"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "rounded px-3 py-1 text-sm",
                mode === m ? "bg-btn font-semibold text-fg" : "text-muted hover:text-fg",
              )}
            >
              {m === "game" ? "Game" : "Free draw"}
            </button>
          ))}
        </div>
      </div>

      {status === "error" && (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-fg">
          <span>The doodle model failed to load.</span>
          <button type="button" onClick={retry} className={BTN_SECONDARY}>
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="relative">
          <DigitCanvas
            handleRef={canvasRef}
            onDirty={onDirty}
            onStrokeEnd={onSettle}
            disabled={canvasDisabled}
            ariaLabel={
              mode === "game"
                ? "Drawing canvas for the current prompt"
                : "Drawing canvas: draw any of the 40 objects"
            }
          />

          {/* Live guess chip */}
          {probs && field && (phase === "playing" || mode === "free") && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
              <span className="rounded-full border border-border bg-header/80 px-3 py-1 text-xs text-fg backdrop-blur">
                {tickerLine(probs, DOODLES.labels)}
              </span>
            </div>
          )}

          {/* Idle / summary / round-end overlays (game mode) */}
          {mode === "game" && phase !== "playing" && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-header/85 p-4 backdrop-blur-sm">
              {phase === "idle" && (
                <div className="text-center">
                  <p className="mb-1 text-base font-semibold text-fg">Pictionary against my model</p>
                  <p className="mx-auto mb-4 max-w-[36ch] text-sm text-muted">
                    {ROUNDS_PER_GAME} prompts, {ROUND_SECONDS} seconds each. Draw, and the CNN
                    guesses live as the strokes land.
                  </p>
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    onClick={startGame}
                    disabled={status !== "ready"}
                  >
                    {status === "ready" ? "Play" : "Loading model..."}
                  </button>
                  {bestWins !== null && bestWins > 0 && (
                    <p className="mt-3 text-xs text-muted">
                      Your best: it guessed {bestWins}/{ROUNDS_PER_GAME}
                    </p>
                  )}
                </div>
              )}
              {phase === "roundEnd" && lastResult && (
                <div className="text-center">
                  <p className="text-xl font-semibold text-fg">
                    {lastResult.outcome === "won" ? (
                      <>
                        <span className="text-green">{lastResult.prompt}</span>! Got it.
                      </>
                    ) : lastResult.outcome === "timeout" ? (
                      "Time's up!"
                    ) : (
                      "Skipped."
                    )}
                  </p>
                  {lastResult.outcome !== "won" && lastResult.finalGuess && (
                    <p className="mt-1 text-sm text-muted">It saw: {lastResult.finalGuess}</p>
                  )}
                </div>
              )}
              {phase === "summary" && (
                <div className="w-full text-center">
                  <p className="mb-3 text-base font-semibold text-fg">
                    It guessed {wins} of {ROUNDS_PER_GAME}
                  </p>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    {results.map((r, i) => (
                      <figure key={i} className="text-xs">
                        {r.snapshot ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.snapshot}
                            alt={`Your drawing of ${r.prompt}`}
                            className={cn(
                              "w-full rounded border",
                              r.outcome === "won" ? "border-green" : "border-border opacity-70",
                            )}
                          />
                        ) : (
                          <div className="aspect-square w-full rounded border border-border" />
                        )}
                        <figcaption className={r.outcome === "won" ? "mt-1 text-green" : "mt-1 text-muted"}>
                          {r.prompt} {r.outcome === "won" ? "✓" : "✗"}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <button type="button" className={BTN_PRIMARY} onClick={startGame}>
                    Play again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {mode === "game" ? (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full border border-border bg-surface px-3 py-1 text-muted">
                  Round {Math.min(round + 1, ROUNDS_PER_GAME)}/{ROUNDS_PER_GAME}
                </span>
                {phase === "playing" && target !== undefined && (
                  <>
                    <span className="rounded-full border border-border bg-surface px-3 py-1 font-semibold text-fg">
                      Draw: {DOODLES.labels[target]}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border border-border px-3 py-1 tabular-nums",
                        secondsLeft <= 5 ? "bg-coral/15 font-semibold text-coral" : "bg-surface text-muted",
                      )}
                    >
                      {secondsLeft}s
                    </span>
                    <button type="button" className={BTN_SECONDARY} onClick={() => endRound("skipped")}>
                      Skip
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => canvasRef.current?.clear()}
                  disabled={phase !== "playing"}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  onClick={() => canvasRef.current?.undo()}
                  disabled={phase !== "playing"}
                >
                  Undo
                </button>
              </div>
              <p className="max-w-md text-sm text-muted">
                The model was trained on 540,000 human doodles across 40 everyday objects. It sees
                the same 28x28 image pipeline as the digit lab below, roughly 40 times a second
                while you draw.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-fg">Top guesses</h3>
              <ol className="flex flex-col gap-1 text-sm">
                {probs && field ? (
                  topIndices(probs, 5).map((i, rank) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className={rank === 0 ? "font-semibold text-green" : "text-muted"}>
                        {DOODLES.labels[i]}
                      </span>
                      <span className="tabular-nums text-xs text-muted">{(probs[i] * 100).toFixed(0)}%</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted">Draw any of the 40 objects and the guesses appear here.</li>
                )}
              </ol>
              <div className="flex gap-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => canvasRef.current?.clear()}>
                  Clear
                </button>
                <button type="button" className={BTN_SECONDARY} onClick={() => canvasRef.current?.undo()}>
                  Undo
                </button>
              </div>
              <details className="text-xs text-muted">
                <summary className="cursor-pointer">What can it recognize?</summary>
                <p className="mt-1 max-w-md">{DOODLES.labels.join(", ")}</p>
              </details>
            </>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
