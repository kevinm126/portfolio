/**
 * Multi-digit segmentation for the digit lab.
 *
 * The model is a single-digit classifier, so a number like "42" must be split
 * into per-digit images before inference. Approach: 8-connected components of
 * ink, then merge components whose horizontal spans overlap (a "5" drawn with
 * a detached top bar, or any multi-stroke digit, becomes one group), then read
 * groups left to right and push each through the standard preprocess pipeline.
 *
 * The known limit is digits that physically touch: connected components
 * cannot split them, and the page copy asks for a little spacing instead.
 */

import { inkFromImageData, preprocessInk, type PreprocessParams } from "./preprocess";

export type DigitSegment = {
  /** 784-float model input for this digit. */
  field: Float32Array;
  /** Horizontal center in buffer coordinates, for left-to-right ordering. */
  centerX: number;
};

/** Ignore specks smaller than this many inked pixels (a stray tap fragment). */
const MIN_PIXELS = 40;
/** Merge two groups when x-overlap exceeds this fraction of the narrower one. */
const MERGE_OVERLAP = 0.3;
/** Safety cap; the canvas cannot legibly hold more digits than this. */
const MAX_DIGITS = 8;

type Group = { x0: number; x1: number; y0: number; y1: number; pixels: number[] };

function connectedComponents(mask: Uint8Array, w: number, h: number): Group[] {
  const seen = new Uint8Array(mask.length);
  const groups: Group[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    const g: Group = { x0: w, x1: -1, y0: h, y1: -1, pixels: [] };
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % w;
      const y = (i / w) | 0;
      g.pixels.push(i);
      if (x < g.x0) g.x0 = x;
      if (x > g.x1) g.x1 = x;
      if (y < g.y0) g.y0 = y;
      if (y > g.y1) g.y1 = y;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const ni = ny * w + nx;
          if (mask[ni] && !seen[ni]) {
            seen[ni] = 1;
            stack.push(ni);
          }
        }
      }
    }
    groups.push(g);
  }
  return groups;
}

function xOverlap(a: Group, b: Group): number {
  const inter = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + 1;
  if (inter <= 0) return 0;
  const narrower = Math.min(a.x1 - a.x0, b.x1 - b.x0) + 1;
  return inter / narrower;
}

function mergeByColumn(groups: Group[]): Group[] {
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (xOverlap(groups[i], groups[j]) >= MERGE_OVERLAP) {
          const a = groups[i];
          const b = groups[j];
          a.x0 = Math.min(a.x0, b.x0);
          a.x1 = Math.max(a.x1, b.x1);
          a.y0 = Math.min(a.y0, b.y0);
          a.y1 = Math.max(a.y1, b.y1);
          a.pixels.push(...b.pixels);
          groups.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }
  return groups;
}

/** Split the canvas into per-digit model inputs, left to right. Null = blank. */
export function segmentDigits(img: ImageData, params: PreprocessParams): DigitSegment[] | null {
  const w = img.width;
  const h = img.height;
  const ink = inkFromImageData(img);
  const mask = new Uint8Array(ink.length);
  for (let i = 0; i < ink.length; i++) mask[i] = ink[i] > params.inkThreshold ? 1 : 0;

  let groups = connectedComponents(mask, w, h).filter((g) => g.pixels.length >= MIN_PIXELS);
  if (!groups.length) return null;
  groups = mergeByColumn(groups);
  groups.sort((a, b) => (a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2);
  if (groups.length > MAX_DIGITS) {
    groups.sort((a, b) => b.pixels.length - a.pixels.length);
    groups = groups.slice(0, MAX_DIGITS);
    groups.sort((a, b) => (a.x0 + a.x1) / 2 - (b.x0 + b.x1) / 2);
  }

  const segments: DigitSegment[] = [];
  for (const g of groups) {
    // Only this group's ink: overlapping bounding boxes must not leak strokes.
    const own = new Float32Array(ink.length);
    for (const i of g.pixels) own[i] = ink[i];
    const field = preprocessInk(own, w, h, params);
    if (field) segments.push({ field, centerX: (g.x0 + g.x1) / 2 });
  }
  return segments.length ? segments : null;
}
