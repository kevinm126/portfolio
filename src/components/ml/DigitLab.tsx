"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DigitCanvas, type DigitCanvasHandle } from "./DigitCanvas";
import { InputPreview } from "./InputPreview";
import { ProbabilityBars } from "./ProbabilityBars";
import { DIGITS } from "./metrics";
import { batchPredictHead } from "./personal";
import { occlusionMap, type SaliencyResult } from "./saliency";
import { useDigitReading } from "./useDigitReading";
import { useModel } from "./useModel";
import { usePersonalHead } from "./usePersonalHead";
import { BTN_PRIMARY, BTN_SECONDARY } from "./ui";
import { cn } from "@/lib/utils";

export function DigitLab() {
  const { status, model, retry } = useModel("digits");
  const canvasRef = useRef<DigitCanvasHandle | null>(null);
  const personal = usePersonalHead();
  const { digits, onDirty, onSettle } = useDigitReading(canvasRef, model, DIGITS.preprocess, personal.headRef);

  const [heat, setHeat] = useState<SaliencyResult | null>(null);
  const [sweep, setSweep] = useState<{ done: number; total: number } | null>(null);
  const [announce, setAnnounce] = useState("");
  const [pickedIdx, setPickedIdx] = useState<number | null>(null);

  // The focused digit drives the bars, the big preview, and saliency.
  // Default focus: the least confident digit (the interesting one).
  let focus = -1;
  if (digits && digits.length) {
    if (pickedIdx !== null && pickedIdx < digits.length) {
      focus = pickedIdx;
    } else {
      focus = 0;
      for (let i = 1; i < digits.length; i++) {
        const a = digits[i];
        const b = digits[focus];
        if (a.probs && b.probs && a.top !== null && b.top !== null && a.probs[a.top] < b.probs[b.top]) {
          focus = i;
        }
      }
    }
  }
  const focused = focus >= 0 && digits ? digits[focus] : null;

  const reading = digits
    ? digits.map((d) => (d.top === null ? "?" : DIGITS.labels[d.top])).join("")
    : null;

  const onStrokeEnd = useCallback(() => {
    setHeat(null);
    onSettle();
  }, [onSettle]);

  const onDirtyWrapped = useCallback(() => {
    setHeat((h) => (h ? null : h));
    setPickedIdx(null);
    onDirty();
  }, [onDirty]);

  // Screen readers get one calm, debounced announcement, not the live stream.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!digits || !reading || reading.includes("?")) {
        setAnnounce("");
        return;
      }
      if (digits.length === 1) {
        const d = digits[0];
        setAnnounce(`Prediction: ${reading}, ${d.probs && d.top !== null ? (d.probs[d.top] * 100).toFixed(0) : 0} percent`);
      } else {
        setAnnounce(`Reading: ${reading}, ${digits.length} digits`);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [digits, reading]);

  const runSaliency = useCallback(async () => {
    if (!model || !focused) return;
    const target = focused.field;
    // Explain the same path the prediction used: through the personal head
    // when one is active, otherwise the graph's own classifier.
    const score =
      model.runFeatures && personal.headRef.current
        ? async (batch: Float32Array, n: number) => {
            const out = await model.runFeatures!(batch, n);
            return batchPredictHead(personal.headRef.current!, out.features, n);
          }
        : undefined;
    setSweep({ done: 0, total: 1 });
    try {
      const result = await occlusionMap(model, target, (done, total) => setSweep({ done, total }), score);
      setHeat(result);
    } finally {
      setSweep(null);
    }
  }, [model, focused, personal.headRef]);

  const teachFocused = useCallback(
    (label: number) => {
      if (!focused?.features) return;
      personal.teach(focused.features, label);
      setHeat(null);
      onSettle();
    },
    [focused, personal, onSettle],
  );

  return (
    <section aria-labelledby="digit-lab-heading" className="mt-10">
      <h2 id="digit-lab-heading" className="mb-1 text-lg font-semibold text-fg">
        Digit lab
      </h2>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        The classic: draw a digit, or a whole number like 42, and watch the CNN score every stroke.
        Multi-digit numbers are split into per-digit images (leave a little space between digits),
        and the small grid shows exactly what the model receives after cropping, scaling, and
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
            ariaLabel="Drawing canvas: draw a digit or a multi-digit number"
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
              disabled={!focused || !model || sweep !== null}
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
              {reading && focused ? (
                digits!.length === 1 ? (
                  <>
                    Looks like a <span className="text-green">{reading}</span>
                  </>
                ) : (
                  <>
                    Looks like <span className="text-green">{reading}</span>
                  </>
                )
              ) : (
                "Waiting for ink"
              )}
            </h3>

            {digits && digits.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Digits, left to right">
                {digits.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPickedIdx(i)}
                    aria-pressed={i === focus}
                    aria-label={`Digit ${i + 1} of ${digits.length}: ${
                      d.top !== null ? DIGITS.labels[d.top] : "unknown"
                    }${d.probs && d.top !== null ? `, ${(d.probs[d.top] * 100).toFixed(0)} percent` : ""}`}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-1.5",
                      i === focus ? "border-green bg-btn" : "border-border hover:bg-btn",
                    )}
                  >
                    <InputPreview field={d.field} className="h-[56px] w-[56px] rounded-sm" />
                    <span className="text-xs tabular-nums text-muted">
                      <span className="font-semibold text-fg">{d.top !== null ? DIGITS.labels[d.top] : "?"}</span>
                      {d.probs && d.top !== null ? ` ${(d.probs[d.top] * 100).toFixed(0)}%` : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <ProbabilityBars probs={focused?.probs ?? null} labels={DIGITS.labels} />
            {digits && digits.length > 1 && (
              <p className="mt-2 text-xs text-muted">
                Bars, preview, and the explainer follow the highlighted digit; click another to
                inspect it.
              </p>
            )}

            {personal.available && focused?.features && focused.top !== null && (
              <div className="mt-4 rounded-md border border-border bg-surface p-3">
                <p className="mb-2 text-xs text-muted">
                  Got it wrong? Tap what you meant and it adapts to your handwriting, right here
                  in your browser (a few gradient steps on the final layer; nothing is uploaded).
                </p>
                <div className="flex flex-wrap gap-1" role="group" aria-label="Teach the correct digit">
                  {DIGITS.labels.map((label, i) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => teachFocused(i)}
                      className={cn(
                        "h-8 w-8 rounded-md border text-sm font-semibold",
                        i === focused.top
                          ? "border-green text-green"
                          : "border-border text-fg hover:bg-btn",
                      )}
                      aria-label={`This is a ${label}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {personal.correctionsCount > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Personalized on {personal.correctionsCount} correction
                    {personal.correctionsCount === 1 ? "" : "s"}.{" "}
                    <button type="button" onClick={personal.reset} className="text-link hover:underline">
                      Forget my handwriting
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0">
            <h3 className="mb-2 text-sm font-semibold text-fg">What the model sees</h3>
            <InputPreview
              field={focused?.field ?? null}
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
