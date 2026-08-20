"use client";

import { useCallback, useEffect, useState } from "react";
import { DIGITS, DOODLES } from "./metrics";
import { getModel, type SketchModel } from "./model";

export type ModelStatus = "loading" | "ready" | "error";

type State = { status: ModelStatus; model: SketchModel | null };

/** Load one of the two lab models; failed loads can be retried. */
export function useModel(key: "digits" | "doodles"): State & { retry: () => void } {
  const meta = key === "digits" ? DIGITS : DOODLES;
  const [state, setState] = useState<State>({ status: "loading", model: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getModel(meta.modelFile, meta.labels.length)
      .then((model) => {
        if (!cancelled) setState({ status: "ready", model });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error", model: null });
      });
    return () => {
      cancelled = true;
    };
  }, [meta.modelFile, meta.labels.length, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", model: null });
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
