/** Shared knobs for the ML Lab page. */

/** Logical size of the offscreen stroke buffer both demos draw into. */
export const BUFFER_SIZE = 280;

/** Brush width in buffer pixels; about 2/28 of the field, like an MNIST pen. */
export const STROKE_WIDTH = 20;

/** Minimum ms between live predictions while a stroke is in progress. */
export const PREDICT_THROTTLE_MS = 120;

/** Doodle Duel game rules. */
export const ROUND_SECONDS = 20;
export const ROUNDS_PER_GAME = 6;
/** The model "gets it" when the target is top-1 at or above this probability. */
export const WIN_PROB = 0.5;

/** Occlusion saliency: patch size and stride over the 28x28 field. */
export const OCCLUSION_PATCH = 7;
export const OCCLUSION_STRIDE = 3;
/** Batch size for saliency inference (the ONNX graph has a dynamic batch axis). */
export const OCCLUSION_BATCH = 16;

/** Fixed canvas colors, both themes (the chess board sets the precedent). */
export const CANVAS_BG = "#0d1117";
export const CANVAS_INK = "#f0f6fc";
