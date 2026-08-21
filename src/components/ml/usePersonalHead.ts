"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DIGITS } from "./metrics";
import {
  MAX_CORRECTIONS,
  cloneHead,
  fitHead,
  loadPersonal,
  savePersonal,
  wipePersonal,
  type Correction,
  type PersonalHead,
} from "./personal";

/**
 * State for "teach it your handwriting": loads the base head exported next to
 * the digit model, restores any saved personal head from localStorage, and
 * turns corrections into gradient-descent refits. Unavailable (available:
 * false) when the shipped model does not expose features + a head file.
 */
export function usePersonalHead(): {
  available: boolean;
  /** Read by the prediction loop; stable ref so the loop never re-arms. */
  headRef: React.MutableRefObject<PersonalHead | null>;
  correctionsCount: number;
  teach(features: Float32Array, label: number): void;
  reset(): void;
} {
  const [available, setAvailable] = useState(false);
  const [correctionsCount, setCorrectionsCount] = useState(0);
  const headRef = useRef<PersonalHead | null>(null);
  const baseRef = useRef<PersonalHead | null>(null);
  const correctionsRef = useRef<Correction[]>([]);

  useEffect(() => {
    if (!DIGITS.headFile || !DIGITS.featDim) return;
    let cancelled = false;
    fetch(DIGITS.headFile)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json: { w: number[]; b: number[] }) => {
        if (cancelled) return;
        const base: PersonalHead = {
          w: Float32Array.from(json.w),
          b: Float32Array.from(json.b),
          numClasses: DIGITS.labels.length,
          featDim: DIGITS.featDim!,
        };
        baseRef.current = base;
        const stored = loadPersonal(DIGITS.modelVersion, base);
        headRef.current = stored ? stored.head : cloneHead(base);
        correctionsRef.current = stored ? stored.corrections : [];
        setCorrectionsCount(correctionsRef.current.length);
        setAvailable(true);
      })
      .catch(() => {
        /* no head file: the teach UI simply stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const teach = useCallback((features: Float32Array, label: number) => {
    const base = baseRef.current;
    const current = headRef.current;
    if (!base || !current) return;
    correctionsRef.current = [...correctionsRef.current, { features: features.slice(), label }].slice(
      -MAX_CORRECTIONS,
    );
    const { head } = fitHead(current, base, correctionsRef.current);
    headRef.current = head;
    savePersonal(DIGITS.modelVersion, head, correctionsRef.current);
    setCorrectionsCount(correctionsRef.current.length);
  }, []);

  const reset = useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    wipePersonal();
    headRef.current = cloneHead(base);
    correctionsRef.current = [];
    setCorrectionsCount(0);
  }, []);

  return { available, headRef, correctionsCount, teach, reset };
}
