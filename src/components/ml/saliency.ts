/**
 * Occlusion saliency: slide a patch of background over the 28x28 input,
 * re-run the model for every position, and record how much the top class's
 * probability drops. Big drop = the model was leaning on that region.
 *
 * The exported graphs take a dynamic batch axis, so the sweep runs as a few
 * batched inferences instead of dozens of single ones.
 */

import { OCCLUSION_BATCH, OCCLUSION_PATCH, OCCLUSION_STRIDE } from "./constants";
import { FIELD } from "./preprocess";
import type { SketchModel } from "./model";

export type SaliencyResult = {
  /** Row-major grid of confidence drops in [0, 1]. */
  heat: Float32Array;
  gridSize: number;
  classIndex: number;
  baseProb: number;
};

export async function occlusionMap(
  model: SketchModel,
  base: Float32Array,
  onProgress?: (done: number, total: number) => void,
): Promise<SaliencyResult> {
  const grid = Math.floor((FIELD - OCCLUSION_PATCH) / OCCLUSION_STRIDE) + 1;
  const total = grid * grid;

  const baseProbs = await model.run(base, 1);
  let classIndex = 0;
  for (let i = 1; i < baseProbs.length; i++) {
    if (baseProbs[i] > baseProbs[classIndex]) classIndex = i;
  }
  const baseProb = baseProbs[classIndex];

  const heat = new Float32Array(total);
  let done = 0;
  onProgress?.(0, total);
  for (let start = 0; start < total; start += OCCLUSION_BATCH) {
    const count = Math.min(OCCLUSION_BATCH, total - start);
    const batch = new Float32Array(count * FIELD * FIELD);
    for (let b = 0; b < count; b++) {
      batch.set(base, b * FIELD * FIELD);
      const pos = start + b;
      const gy = Math.floor(pos / grid) * OCCLUSION_STRIDE;
      const gx = (pos % grid) * OCCLUSION_STRIDE;
      for (let y = gy; y < gy + OCCLUSION_PATCH; y++) {
        for (let x = gx; x < gx + OCCLUSION_PATCH; x++) {
          batch[b * FIELD * FIELD + y * FIELD + x] = 0;
        }
      }
    }
    const probs = await model.run(batch, count);
    for (let b = 0; b < count; b++) {
      const drop = baseProb - probs[b * model.numClasses + classIndex];
      heat[start + b] = drop > 0 ? drop : 0;
    }
    done += count;
    onProgress?.(done, total);
  }
  return { heat, gridSize: grid, classIndex, baseProb };
}
