"use client";

import { useCallback, useEffect, useRef } from "react";
import { PREDICT_THROTTLE_MS } from "./constants";

/**
 * The shared inference scheduler: throttled while a stroke is in progress,
 * immediate on stroke end, never overlapping, at most one trailing run queued.
 * The actual work (preprocess + model call) is the caller's `run`.
 */
export function useInferenceLoop(run: () => Promise<void>) {
  const runRef = useRef(run);
  useEffect(() => {
    runRef.current = run;
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

  const kick = useCallback(async () => {
    if (busyRef.current) {
      queuedRef.current = true;
      return;
    }
    busyRef.current = true;
    try {
      do {
        queuedRef.current = false;
        if (!mountedRef.current) break;
        lastRef.current = performance.now();
        await runRef.current();
      } while (queuedRef.current);
    } finally {
      busyRef.current = false;
    }
  }, []);

  /** Call on every stroke segment; throttled. */
  const onDirty = useCallback(() => {
    const since = performance.now() - lastRef.current;
    if (since >= PREDICT_THROTTLE_MS) {
      void kick();
    } else if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void kick();
      }, PREDICT_THROTTLE_MS - since);
    }
  }, [kick]);

  /** Call on stroke end / clear / undo; immediate. */
  const onSettle = useCallback(() => {
    void kick();
  }, [kick]);

  return { onDirty, onSettle };
}
