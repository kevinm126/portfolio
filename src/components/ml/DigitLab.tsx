"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DigitCanvas, type DigitCanvasHandle } from "./DigitCanvas";
import { InputPreview } from "./InputPreview";
import { ProbabilityBars } from "./ProbabilityBars";
import { DIGITS } from "./metrics";
import { occlusionMap, type SaliencyResult } from "./saliency";
import { useLivePrediction } from "./useLivePrediction";
import { useModel } from "./useModel";
import { BTN_PRIMARY, BTN_SECONDARY } from "./ui";

export function DigitLab() {
  const { status, model, retry } = useModel("digits");
  const canvasRef = useRef<DigitCanvasHandle | null>(null);
  const { probs, field, onDirty, onSettle } = useLivePrediction(canvasRef, model, DIGITS.preprocess);

  const [heat, setHeat] = useState<SaliencyResult | null>(null);
  const [sweep, setSweep] = useState<{ done: number; total: number } | null>(null);
  const [announce, setAnnounce] = useState("");

  const top = probs
    ? probs.reduce((best, v, i) => (v > probs[best] ? i : best), 0)
    : null;

  const onStrokeEnd = useCallback(() => {
    setHeat(null);
    onSettle();
  }, [onSettle]);

  const onDirtyWrapped = useCallback(() => {
    if (heat) setHeat(null);
    onDirty();
  }, [heat, onDirty]);

  // Screen readers get one calm, debounced announcement, not the live stream.
  useEffect(() => {
    const t = setTimeout(() => {
      setAnnounce(
        probs && top !== null
          ? `Prediction: ${DIGITS.labels[top]}, ${(probs[top] * 100).toFixed(0)} percent`
          : "",
      );
    }, 400);
    return () => clearTimeout(t);
  }, [probs, top]);

  const runSaliency = useCallback(async () => {
    if (!model || !field) return;
    setSweep({ done: 0, total: 1 });
    try {
      const result = await occlusionMap(model, field, (done, total) => setSweep({ done, total }));
      setHeat(result);
    } finally {
      setSweep(null);
    }
  }, [model, field]);

  return (
    <section aria-labelledby="digit-lab-heading" className="mt-10">
      <h2 id="digit-lab-heading" className="mb-1 text-lg font-semibold text-fg">
        Digit lab
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        The classic: draw a digit from 0 to 9 and watch the CNN score all ten classes on every
        stroke. The small grid shows exactly what the model receives after cropping, scaling, and
        centering, the same construction MNIST itself used. Trained on MNIST, so plain 1s and
        uncrossed 7s work best.
      </p>

      {status === "error" && (
        <div className="mb-4 flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-fg">
          <span>The digit model failed to load.</span>
          <button type="button" onClick={retry} className={BTN_SECONDARY}>
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div>
          <DigitCanvas
            handleRef={canvasRef}
            onDirty={onDirtyWrapped}
            onStrokeEnd={onStrokeEnd}
            disabled={status !== "ready"}
            ariaLabel="Drawing canvas: draw a digit from 0 to 9"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className={BTN_SECONDARY} onClick={() => canvasRef.current?.clear()}>
              Clear
            </button>
            <button type="button" className={BTN_SECONDARY} onClick={() => canvasRef.current?.undo()}>
              Undo
            </button>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={runSaliency}
              disabled={!field || !model || sweep !== null}
            >
              {sweep ? `Explaining... ${Math.round((sweep.done / sweep.total) * 100)}%` : "Explain this prediction"}
            </button>
          </div>
          {status === "loading" && (
            <p className="mt-2 text-xs text-muted">Loading the model (about 2 MB, runs entirely in your browser)...</p>
          )}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 text-sm font-semibold text-fg">
              {top !== null && probs ? (
                <>
                  Looks like a <span className="text-green">{DIGITS.labels[top]}</span>
                </>
              ) : (
                "Waiting for ink"
              )}
            </h3>
            <ProbabilityBars probs={probs} labels={DIGITS.labels} />
          </div>
          <div className="shrink-0">
            <h3 className="mb-2 text-sm font-semibold text-fg">What the model sees</h3>
            <InputPreview
              field={field}
              heat={heat ? { values: heat.heat, gridSize: heat.gridSize } : null}
              className="h-[140px] w-[140px] rounded-md border border-border"
            />
            {heat && (
              <p className="mt-2 max-w-[160px] text-xs text-muted">
                Brighter regions hurt the model&apos;s confidence most when hidden.
              </p>
            )}
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  );
}
