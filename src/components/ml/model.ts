/**
 * ONNX Runtime session management for the ML Lab.
 *
 * Everything runs client-side: the wasm runtime and the .onnx models are
 * self-hosted under /ml/ (the CSP's connect-src 'self' forbids the package's
 * CDN default), single-threaded (the site sends no COOP/COEP headers), and
 * lazy-imported so onnxruntime-web stays out of the page's initial JS chunk.
 *
 * Both models share one runtime; sessions are cached per model URL, and every
 * caller funnels through run(), which serializes inference because an ONNX
 * session must not run concurrently with itself.
 */

import { ORT_VERSION } from "./ort-version";

export type SketchModel = {
  /** Run a batch: input is batch*784 floats in [0, 1]; returns batch*numClasses probs. */
  run(input: Float32Array, batch: number): Promise<Float32Array>;
  numClasses: number;
};

// The /wasm subpath ships the wasm-EP-only runtime, which loads the plain
// ort-wasm-simd-threaded.{mjs,wasm} pair we self-host. The default export
// would try to fetch the .jsep (WebGPU) variant instead.
type Ort = typeof import("onnxruntime-web/wasm");

let ortPromise: Promise<Ort> | null = null;
const sessions = new Map<string, Promise<SketchModel>>();

function loadOrt(): Promise<Ort> {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web/wasm").then((ort) => {
      ort.env.wasm.wasmPaths = `/ml/ort/${ORT_VERSION}/`;
      ort.env.wasm.numThreads = 1;
      return ort;
    });
    ortPromise.catch(() => {
      ortPromise = null; // let a Retry click attempt a fresh import
    });
  }
  return ortPromise;
}

async function createModel(url: string, numClasses: number): Promise<SketchModel> {
  if (typeof WebAssembly !== "object") {
    throw new Error("This browser does not support WebAssembly.");
  }
  const ort = await loadOrt();
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Model download failed (${resp.status}).`);
  const buf = await resp.arrayBuffer();
  const session = await ort.InferenceSession.create(buf, {
    executionProviders: ["wasm"],
  });

  let inFlight: Promise<unknown> = Promise.resolve();
  const run = (input: Float32Array, batch: number): Promise<Float32Array> => {
    const next = inFlight.then(async () => {
      const tensor = new ort.Tensor("float32", input, [batch, 1, 28, 28]);
      const out = await session.run({ input: tensor });
      return out.probs.data as Float32Array;
    });
    // Keep the chain alive even when a run fails; callers still see the error.
    inFlight = next.catch(() => undefined);
    return next;
  };

  // Warmup: the first run compiles kernels and would otherwise lag mid-stroke.
  await run(new Float32Array(784), 1);
  return { run, numClasses };
}

/** Cached loader; a failed load is evicted so Retry can work. */
export function getModel(url: string, numClasses: number): Promise<SketchModel> {
  let p = sessions.get(url);
  if (!p) {
    p = createModel(url, numClasses);
    sessions.set(url, p);
    p.catch(() => sessions.delete(url));
  }
  return p;
}
