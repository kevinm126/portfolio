"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DigitCanvasHandle } from "./DigitCanvas";
import type { SketchModel } from "./model";
import { preprocess, type PreprocessParams } from "./preprocess";
import { useInferenceLoop } from "./useInferenceLoop";

/** Whole-canvas live inference: one field, one prediction. Used by Doodle Duel. */
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

  const run = useCallback(async () => {
    const img = canvasRef.current?.imageData();
    if (!img) return;
    const f = preprocess(img, paramsRef.current);
    setField(f);
    if (!f) {
      setProbs(null);
      return;
    }
    const m = modelRef.current;
    if (!m) return;
    try {
      const p = await m.run(f, 1);
      setProbs(p.slice());
    } catch {
      /* a failed run keeps the previous bars; load errors surface elsewhere */
    }
  }, [canvasRef]);

  const { onDirty, onSettle } = useInferenceLoop(run);
  return { probs, field, onDirty, onSettle };
}
