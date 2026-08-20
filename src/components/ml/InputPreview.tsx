"use client";

import { useEffect, useRef } from "react";
import { FIELD } from "./preprocess";

/**
 * "What the model sees": the live 28x28 input tensor, magnified with hard
 * pixel edges. Optionally overlays an occlusion-saliency heatmap (coral,
 * upscaled bilinearly from the sweep grid).
 */

type Props = {
  /** 784 floats in [0, 1], or null when the canvas is blank. */
  field: Float32Array | null;
  /** Saliency grid (row-major, [0, 1]-ish) and its side length. */
  heat?: { values: Float32Array; gridSize: number } | null;
  className?: string;
};

const BG = [13, 17, 23]; // #0d1117, matches the drawing canvas
const INK = [240, 246, 252]; // #f0f6fc
const HEAT = [255, 123, 114]; // coral, GitHub's --color-coral

export function InputPreview({ field, heat, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(FIELD, FIELD);

    let maxHeat = 0;
    if (heat) {
      for (const v of heat.values) if (v > maxHeat) maxHeat = v;
    }

    for (let y = 0; y < FIELD; y++) {
      for (let x = 0; x < FIELD; x++) {
        const i = y * FIELD + x;
        const v = field ? field[i] : 0;
        let r = BG[0] + (INK[0] - BG[0]) * v;
        let g = BG[1] + (INK[1] - BG[1]) * v;
        let b = BG[2] + (INK[2] - BG[2]) * v;
        if (heat && maxHeat > 0) {
          // Bilinear sample of the coarse sweep grid at this pixel.
          const scale = (heat.gridSize - 1) / (FIELD - 1);
          const gy = y * scale;
          const gx = x * scale;
          const y0 = Math.min(Math.floor(gy), heat.gridSize - 1);
          const x0 = Math.min(Math.floor(gx), heat.gridSize - 1);
          const y1 = Math.min(y0 + 1, heat.gridSize - 1);
          const x1 = Math.min(x0 + 1, heat.gridSize - 1);
          const fy = gy - y0;
          const fx = gx - x0;
          const g00 = heat.values[y0 * heat.gridSize + x0];
          const g01 = heat.values[y0 * heat.gridSize + x1];
          const g10 = heat.values[y1 * heat.gridSize + x0];
          const g11 = heat.values[y1 * heat.gridSize + x1];
          const h =
            (g00 * (1 - fy) * (1 - fx) + g01 * (1 - fy) * fx + g10 * fy * (1 - fx) + g11 * fy * fx) /
            maxHeat;
          const a = Math.min(1, Math.max(0, h)) * 0.85;
          r = r * (1 - a) + HEAT[0] * a;
          g = g * (1 - a) + HEAT[1] * a;
          b = b * (1 - a) + HEAT[2] * a;
        }
        img.data[i * 4] = Math.round(r);
        img.data[i * 4 + 1] = Math.round(g);
        img.data[i * 4 + 2] = Math.round(b);
        img.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [field, heat]);

  return (
    <canvas
      ref={canvasRef}
      width={FIELD}
      height={FIELD}
      role="img"
      aria-label="The 28 by 28 grayscale image the model receives"
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
