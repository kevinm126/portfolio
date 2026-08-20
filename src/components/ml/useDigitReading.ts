"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DigitCanvasHandle } from "./DigitCanvas";
import type { SketchModel } from "./model";
import { FIELD, type PreprocessParams } from "./preprocess";
import { segmentDigits } from "./segment";
import { useInferenceLoop } from "./useInferenceLoop";

export type DigitRead = {
  field: Float32Array;
  /** Null while the model is still loading; the preview strip renders anyway. */
  probs: Float32Array | null;
  top: number | null;
};

/**
 * Multi-digit live inference for the digit lab: segment the canvas into
 * digit groups, classify all of them in one batched run (the ONNX graph has
 * a dynamic batch axis), and return them left to right.
 */
export function useDigitReading(
  canvasRef: React.MutableRefObject<DigitCanvasHandle | null>,
  model: SketchModel | null,
  params: PreprocessParams,
) {
  const [digits, setDigits] = useState<DigitRead[] | null>(null);

  const modelRef = useRef(model);
  const paramsRef = useRef(params);
  useEffect(() => {
    modelRef.current = model;
    paramsRef.current = params;
  });

  const run = useCallback(async () => {
    const img = canvasRef.current?.imageData();
    if (!img) return;
    const segs = segmentDigits(img, paramsRef.current);
    if (!segs) {
      setDigits(null);
      return;
    }
    const m = modelRef.current;
    let all: Float32Array | null = null;
    if (m) {
      const batch = new Float32Array(segs.length * FIELD * FIELD);
      segs.forEach((s, i) => batch.set(s.field, i * FIELD * FIELD));
      try {
        all = (await m.run(batch, segs.length)).slice();
      } catch {
        /* keep previous reading on a failed run */
        return;
      }
    }
    setDigits(
      segs.map((s, i) => {
        if (!all || !m) return { field: s.field, probs: null, top: null };
        const p = all.slice(i * m.numClasses, (i + 1) * m.numClasses);
        let top = 0;
        for (let c = 1; c < p.length; c++) if (p[c] > p[top]) top = c;
        return { field: s.field, probs: p, top };
      }),
    );
  }, [canvasRef]);

  const { onDirty, onSettle } = useInferenceLoop(run);
  return { digits, onDirty, onSettle };
}
