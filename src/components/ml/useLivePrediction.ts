"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PREDICT_THROTTLE_MS } from "./constants";
import type { DigitCanvasHandle } from "./DigitCanvas";
import type { SketchModel } from "./model";
import { preprocess, type PreprocessParams } from "./preprocess";

/**
 * The shared live-inference loop: preprocess the canvas and run the model,
 * throttled while a stroke is in progress, always exact on stroke end.
 * Runs never overlap; at most one trailing run is queued.
 */
export function useLivePrediction(
  canvasRef: React.MutableRefObject<DigitCanvasHandle | null>,
  model: SketchModel | null,
  params: PreprocessParams,
) {
  const [probs, setProbs] = useState<Float32Array | null>(null);
  const [field, setField] = useState<Float32Array | null>(null);

  const modelRef = useRef(model);
  const paramsRef = useRef(params);
  useEffect(() => {
    modelRef.current = model;
    paramsRef.current = params;
  });

  const busyRef = useRef(false);
  const queuedRef = useRef(false);
  const lastRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const predict = useCallback(async () => {
    if (busyRef.current) {
      queuedRef.current = true;
      return;
    }
    busyRef.current = true;
    try {
      do {
        queuedRef.current = false;
        const img = canvasRef.current?.imageData();
        if (!img || !mountedRef.current) break;
        const f = preprocess(img, paramsRef.current);
        setField(f);
        if (!f) {
          setProbs(null);
          break;
        }
        const m = modelRef.current;
        if (!m) break;
        lastRef.current = performance.now();
        try {
          const p = await m.run(f, 1);
          if (mountedRef.current) setProbs(p.slice());
        } catch {
          /* a failed run keeps the previous bars; load errors surface elsewhere */
        }
      } while (queuedRef.current);
    } finally {
      busyRef.current = false;
    }
  }, [canvasRef]);

  /** Call on every stroke segment; throttled. */
  const onDirty = useCallback(() => {
    const since = performance.now() - lastRef.current;
    if (since >= PREDICT_THROTTLE_MS) {
      void predict();
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void predict();
      }, PREDICT_THROTTLE_MS - since);
    }
  }, [predict]);

  /** Call on stroke end / clear / undo; immediate. */
  const onSettle = useCallback(() => {
    void predict();
  }, [predict]);

  return { probs, field, onDirty, onSettle, refresh: onSettle };
}
