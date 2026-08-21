/**
 * Typed access to src/content/ml-metrics.json, the model-card data exported by
 * the sketch-lab training repo (dist/metrics.json). Copied over whenever a
 * model is retrained; treat it as generated, never hand-edited.
 */

import raw from "@/content/ml-metrics.json";
import type { PreprocessParams } from "./preprocess";

export type PerClassStat = { label: string; precision: number; recall: number; support: number };

export type ModelMetrics = {
  modelVersion: string;
  modelFile: string;
  curvesFile: string;
  confusionFile: string;
  trainedAt: string;
  framework: string;
  opset: number;
  params: number;
  modelSizeBytes: number;
  epochs: number;
  bestEpoch: number;
  testAccuracy: number;
  testLoss: number;
  canvasSimAccuracy?: number;
  normalization: { mean: number; std: number };
  architecture: string[];
  input: { shape: number[]; range: string; normalization: string };
  preprocess: PreprocessParams;
  labels: string[];
  perClass: PerClassStat[];
  /** Doodles only: per-class recall on the canvas-simulation round trip. */
  canvasPerClass?: { label: string; recall: number; n: number }[];
  /** Doodles only: the measured subset of labels the game may prompt. */
  promptPool?: string[];
  /** Digits v2+: the base final-layer weights for in-browser personalization. */
  headFile?: string;
  /** Digits v2+: penultimate feature dimension exposed by the graph. */
  featDim?: number;
  repoUrl: string;
  notebookUrl: string;
};

export type MLMetrics = {
  attribution: string;
  models: { digits: ModelMetrics; doodles: ModelMetrics };
};

export const ML_METRICS = raw as MLMetrics;

export const DIGITS = ML_METRICS.models.digits;
export const DOODLES = ML_METRICS.models.doodles;
