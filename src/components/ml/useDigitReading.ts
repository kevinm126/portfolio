"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DigitCanvasHandle } from "./DigitCanvas";
import type { SketchModel } from "./model";
import { batchPredictHead, type PersonalHead } from "./personal";
import { FIELD, type PreprocessParams } from "./preprocess";
import { segmentDigits } from "./segment";
import { useInferenceLoop } from "./useInferenceLoop";

export type DigitRead = {
  field: Float32Array;
  /** Null while the model is still loading; the preview strip renders anyway. */
  probs: Float32Array | null;
  top: number | null;
  /** Penultimate activations, present when the graph exposes them (v2+). */
  features: Float32Array | null;
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
  /** When set (and the graph exposes features), classification goes through
   *  the personal head instead of the graph's own final layer. */
  personalHeadRef?: React.MutableRefObject<PersonalHead | null>,
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
    const head = personalHeadRef?.current ?? null;
    let allProbs: Float32Array | null = null;
    let allFeatures: Float32Array | null = null;
    if (m) {
      const batch = new Float32Array(segs.length * FIELD * FIELD);
      segs.forEach((s, i) => batch.set(s.field, i * FIELD * FIELD));
      try {
        if (m.runFeatures && head) {
          const out = await m.runFeatures(batch, segs.length);
          allFeatures = out.features.slice();
          // Classify through the personal head (equals the base model until
          // the visitor teaches it something).
          allProbs = batchPredictHead(head, allFeatures, segs.length);
        } else {
          allProbs = (await m.run(batch, segs.length)).slice();
        }
      } catch {
        /* keep previous reading on a failed run */
        return;
      }
    }
    setDigits(
      segs.map((s, i) => {
        if (!allProbs || !m) return { field: s.field, probs: null, top: null, features: null };
        const p = allProbs.slice(i * m.numClasses, (i + 1) * m.numClasses);
        let top = 0;
        for (let c = 1; c < p.length; c++) if (p[c] > p[top]) top = c;
        const features = allFeatures && head
          ? allFeatures.slice(i * head.featDim, (i + 1) * head.featDim)
          : null;
        return { field: s.field, probs: p, top, features };
      }),
    );
  }, [canvasRef, personalHeadRef]);

  const { onDirty, onSettle } = useInferenceLoop(run);
  return { digits, onDirty, onSettle };
}
