/**
 * Canvas -> model-input pipeline, the TypeScript twin of sketch-lab's
 * preprocess.py. The two implementations must stay operation-for-operation
 * identical (same rounding, same area-average resample, same centering);
 * sketch-lab's validate_onnx.py proves the pipeline end to end.
 *
 * Pipeline (MNIST's own construction, generalized):
 *   1. bounding box of ink above a threshold
 *   2. area-average resample so the longest side equals targetSide
 *   3. paste into 28x28, centered by center of mass ("mass", MNIST) or by
 *      bounding-box center ("box")
 *
 * Rounding convention everywhere: Math.floor(x + 0.5), i.e. Math.round,
 * spelled out so nobody swaps in a different rounding by accident.
 */

export const FIELD = 28;

export type PreprocessParams = {
  targetSide: number;
  centering: "mass" | "box";
  inkThreshold: number;
};

export type Box = { x0: number; y0: number; x1: number; y1: number };

const jsRound = (x: number) => Math.floor(x + 0.5);

/** Ink intensity from the stroke buffer: the alpha channel, scaled to [0, 1]. */
export function inkFromImageData(img: ImageData): Float32Array {
  const n = img.width * img.height;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = img.data[i * 4 + 3] / 255;
  return out;
}

/** Inclusive bounds of ink > thresh, or null for a blank canvas. */
export function boundingBox(ink: Float32Array, w: number, h: number, thresh: number): Box | null {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (ink[y * w + x] > thresh) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** Area-average (box filter) resample. Deterministic, matches preprocess.py. */
export function resampleArea(
  src: Float32Array,
  inW: number,
  inH: number,
  outW: number,
  outH: number,
): Float32Array {
  const out = new Float32Array(outW * outH);
  const sy = inH / outH;
  const sx = inW / outW;
  for (let oy = 0; oy < outH; oy++) {
    const yStart = oy * sy;
    const yEnd = (oy + 1) * sy;
    const iy0 = Math.floor(yStart);
    const iy1 = Math.min(Math.ceil(yEnd), inH);
    for (let ox = 0; ox < outW; ox++) {
      const xStart = ox * sx;
      const xEnd = (ox + 1) * sx;
      const ix0 = Math.floor(xStart);
      const ix1 = Math.min(Math.ceil(xEnd), inW);
      let acc = 0;
      for (let iy = iy0; iy < iy1; iy++) {
        const wy = Math.min(yEnd, iy + 1) - Math.max(yStart, iy);
        if (wy <= 0) continue;
        for (let ix = ix0; ix < ix1; ix++) {
          const wx = Math.min(xEnd, ix + 1) - Math.max(xStart, ix);
          if (wx <= 0) continue;
          acc += src[iy * inW + ix] * wy * wx;
        }
      }
      out[oy * outW + ox] = acc / (sy * sx);
    }
  }
  return out;
}

/** Full pipeline: stroke-buffer ImageData -> 784 floats in [0, 1], or null if blank. */
export function preprocess(img: ImageData, params: PreprocessParams): Float32Array | null {
  const ink = inkFromImageData(img);
  const box = boundingBox(ink, img.width, img.height, params.inkThreshold);
  if (!box) return null;

  const bw = box.x1 - box.x0 + 1;
  const bh = box.y1 - box.y0 + 1;
  const crop = new Float32Array(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      crop[y * bw + x] = ink[(box.y0 + y) * img.width + (box.x0 + x)];
    }
  }

  let ow: number, oh: number;
  if (bw >= bh) {
    ow = params.targetSide;
    oh = Math.max(1, jsRound((bh * params.targetSide) / bw));
  } else {
    oh = params.targetSide;
    ow = Math.max(1, jsRound((bw * params.targetSide) / bh));
  }
  const small = resampleArea(crop, bw, bh, ow, oh);

  let offY: number, offX: number;
  if (params.centering === "mass") {
    let total = 0, sumY = 0, sumX = 0;
    for (let y = 0; y < oh; y++) {
      for (let x = 0; x < ow; x++) {
        const v = small[y * ow + x];
        total += v;
        sumY += y * v;
        sumX += x * v;
      }
    }
    offY = jsRound((FIELD - 1) / 2 - sumY / total);
    offX = jsRound((FIELD - 1) / 2 - sumX / total);
  } else {
    offY = Math.floor((FIELD - oh) / 2);
    offX = Math.floor((FIELD - ow) / 2);
  }
  offY = Math.max(0, Math.min(FIELD - oh, offY));
  offX = Math.max(0, Math.min(FIELD - ow, offX));

  const field = new Float32Array(FIELD * FIELD);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const v = small[y * ow + x];
      field[(offY + y) * FIELD + (offX + x)] = v > 1 ? 1 : v < 0 ? 0 : v;
    }
  }
  return field;
}
