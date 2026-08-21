/**
 * "Teach it your handwriting": a personal softmax head over the digit
 * model's 128-dim penultimate features, trained in the browser with
 * hand-derived gradients. No library, no server: the math is ~30 lines.
 *
 * The head is initialized with the BASE model's own final-layer weights
 * (exported alongside the ONNX graph), so before any corrections it
 * reproduces the base model exactly. Each correction stores (features,
 * label) and re-runs a few epochs of full-batch gradient descent with an
 * L2 pull back toward the base weights, which keeps a handful of examples
 * from overwriting what MNIST taught it.
 *
 * Derivation, for one example with features f, one-hot target y:
 *   logits z = W f + b,  p = softmax(z),  loss = -log p[target]
 *   dL/dz = p - y            (the classic softmax + cross-entropy gradient)
 *   dL/dW = (p - y) f^T      dL/db = p - y
 * plus the regularizer lambda * (W - W_base) from 0.5*lambda*||W - W_base||^2.
 */

export type PersonalHead = {
  /** Row-major [numClasses x featDim]. */
  w: Float32Array;
  b: Float32Array;
  numClasses: number;
  featDim: number;
};

export type Correction = { features: Float32Array; label: number };

export const MAX_CORRECTIONS = 60;
const LR = 0.02;
const EPOCHS = 40;
const L2_TO_BASE = 2e-3;

export function softmax(z: Float32Array): Float32Array {
  let max = -Infinity;
  for (const v of z) if (v > max) max = v;
  const out = new Float32Array(z.length);
  let sum = 0;
  for (let i = 0; i < z.length; i++) {
    out[i] = Math.exp(z[i] - max);
    sum += out[i];
  }
  for (let i = 0; i < z.length; i++) out[i] /= sum;
  return out;
}

export function predictHead(head: PersonalHead, features: Float32Array): Float32Array {
  const { w, b, numClasses, featDim } = head;
  const z = new Float32Array(numClasses);
  for (let c = 0; c < numClasses; c++) {
    let acc = b[c];
    const row = c * featDim;
    for (let j = 0; j < featDim; j++) acc += w[row + j] * features[j];
    z[c] = acc;
  }
  return softmax(z);
}

/** Head predictions for a whole feature batch, concatenated row-major. */
export function batchPredictHead(head: PersonalHead, features: Float32Array, n: number): Float32Array {
  const out = new Float32Array(n * head.numClasses);
  for (let i = 0; i < n; i++) {
    const f = features.subarray(i * head.featDim, (i + 1) * head.featDim) as Float32Array;
    out.set(predictHead(head, f), i * head.numClasses);
  }
  return out;
}

export function cloneHead(head: PersonalHead): PersonalHead {
  return {
    w: head.w.slice(),
    b: head.b.slice(),
    numClasses: head.numClasses,
    featDim: head.featDim,
  };
}

/**
 * Full-batch gradient descent from the current head over all stored
 * corrections. Returns the new head and the final mean cross-entropy.
 */
export function fitHead(
  current: PersonalHead,
  base: PersonalHead,
  corrections: Correction[],
  opts: { lr?: number; epochs?: number; l2?: number } = {},
): { head: PersonalHead; loss: number } {
  const lr = opts.lr ?? LR;
  const epochs = opts.epochs ?? EPOCHS;
  const l2 = opts.l2 ?? L2_TO_BASE;
  const head = cloneHead(current);
  const { numClasses, featDim } = head;
  const n = corrections.length;
  if (!n) return { head, loss: 0 };

  let loss = 0;
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gw = new Float32Array(numClasses * featDim);
    const gb = new Float32Array(numClasses);
    loss = 0;
    for (const ex of corrections) {
      const p = predictHead(head, ex.features);
      loss += -Math.log(Math.max(p[ex.label], 1e-9));
      for (let c = 0; c < numClasses; c++) {
        const dz = p[c] - (c === ex.label ? 1 : 0);
        gb[c] += dz;
        const row = c * featDim;
        for (let j = 0; j < featDim; j++) gw[row + j] += dz * ex.features[j];
      }
    }
    for (let i = 0; i < gw.length; i++) {
      head.w[i] -= lr * (gw[i] / n + l2 * (head.w[i] - base.w[i]));
    }
    for (let c = 0; c < numClasses; c++) {
      head.b[c] -= lr * (gb[c] / n + l2 * (head.b[c] - base.b[c]));
    }
  }
  return { head, loss: loss / n };
}

/* ---------- persistence (localStorage, versioned like memory.ts) ---------- */

type Stored = {
  v: 1;
  /** Guards against reusing state across model versions. */
  modelVersion: string;
  w: number[];
  b: number[];
  corrections: { f: number[]; label: number }[];
};

const KEY = "mlDigitPersonalHead";

const round4 = (x: number) => Math.round(x * 10000) / 10000;

export function savePersonal(modelVersion: string, head: PersonalHead, corrections: Correction[]) {
  try {
    const payload: Stored = {
      v: 1,
      modelVersion,
      w: [...head.w].map(round4),
      b: [...head.b].map(round4),
      corrections: corrections.map((c) => ({ f: [...c.features].map(round4), label: c.label })),
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* private mode etc.; personalization just does not persist */
  }
}

export function loadPersonal(
  modelVersion: string,
  base: PersonalHead,
): { head: PersonalHead; corrections: Correction[] } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (s.v !== 1 || s.modelVersion !== modelVersion) return null;
    if (!Array.isArray(s.w) || s.w.length !== base.w.length) return null;
    if (!Array.isArray(s.b) || s.b.length !== base.b.length) return null;
    const corrections = (s.corrections ?? [])
      .filter((c) => Array.isArray(c.f) && c.f.length === base.featDim)
      .slice(-MAX_CORRECTIONS)
      .map((c) => ({
        features: Float32Array.from(c.f),
        label: Math.min(base.numClasses - 1, Math.max(0, Math.round(Number(c.label) || 0))),
      }));
    return {
      head: {
        w: Float32Array.from(s.w),
        b: Float32Array.from(s.b),
        numClasses: base.numClasses,
        featDim: base.featDim,
      },
      corrections,
    };
  } catch {
    return null;
  }
}

export function wipePersonal() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
