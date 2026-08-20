"use client";

import { useEffect, useRef } from "react";
import { BUFFER_SIZE, CANVAS_BG, CANVAS_INK, STROKE_WIDTH } from "./constants";

/**
 * The shared drawing surface for both ML Lab demos.
 *
 * Strokes land in a fixed 280x280 offscreen buffer (white ink on transparent;
 * the model reads the alpha channel), so the visible canvas can resize or
 * re-theme without ever losing pixels: resize just re-blits the buffer.
 */

export type DigitCanvasHandle = {
  clear(): void;
  undo(): void;
  /** Latest buffer pixels for preprocessing, or null before mount. */
  imageData(): ImageData | null;
  /** Small composited PNG (ink over the canvas background) for thumbnails. */
  snapshot(size?: number): string | null;
};

type Props = {
  handleRef: React.MutableRefObject<DigitCanvasHandle | null>;
  onDirty?: () => void;
  onStrokeEnd?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
};

const MAX_UNDO = 20;

export function DigitCanvas({ handleRef, onDirty, onStrokeEnd, disabled, ariaLabel, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);
  const undoRef = useRef<ImageData[]>([]);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  // Callbacks mirrored into refs so the mount effect never needs to re-run.
  const onDirtyRef = useRef(onDirty);
  const onStrokeEndRef = useRef(onStrokeEnd);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    onDirtyRef.current = onDirty;
    onStrokeEndRef.current = onStrokeEnd;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const buffer = document.createElement("canvas");
    buffer.width = BUFFER_SIZE;
    buffer.height = BUFFER_SIZE;
    bufferRef.current = buffer;
    const bctx = buffer.getContext("2d", { willReadFrequently: true })!;
    const ctx = canvas.getContext("2d")!;

    const repaint = () => {
      ctx.setTransform(canvas.width / BUFFER_SIZE, 0, 0, canvas.height / BUFFER_SIZE, 0, 0);
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, BUFFER_SIZE, BUFFER_SIZE);
      ctx.drawImage(buffer, 0, 0);
    };

    const resize = () => {
      const w = wrap.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      repaint();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const toBuffer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * BUFFER_SIZE,
        y: ((e.clientY - rect.top) / rect.height) * BUFFER_SIZE,
      };
    };

    const pushUndo = () => {
      undoRef.current.push(bctx.getImageData(0, 0, BUFFER_SIZE, BUFFER_SIZE));
      if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    };

    const down = (e: PointerEvent) => {
      if (disabledRef.current || !e.isPrimary) return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
      pushUndo();
      drawingRef.current = true;
      const p = toBuffer(e);
      lastRef.current = p;
      bctx.fillStyle = CANVAS_INK;
      bctx.beginPath();
      bctx.arc(p.x, p.y, STROKE_WIDTH / 2, 0, Math.PI * 2);
      bctx.fill();
      repaint();
      onDirtyRef.current?.();
    };

    const move = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      const p = toBuffer(e);
      const last = lastRef.current ?? p;
      bctx.strokeStyle = CANVAS_INK;
      bctx.lineWidth = STROKE_WIDTH;
      bctx.lineCap = "round";
      bctx.lineJoin = "round";
      bctx.beginPath();
      bctx.moveTo(last.x, last.y);
      bctx.lineTo(p.x, p.y);
      bctx.stroke();
      lastRef.current = p;
      repaint();
      onDirtyRef.current?.();
    };

    const up = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastRef.current = null;
      onStrokeEndRef.current?.();
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    // Releases that land off-canvas still end the stroke.
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    handleRef.current = {
      clear() {
        pushUndo();
        bctx.clearRect(0, 0, BUFFER_SIZE, BUFFER_SIZE);
        repaint();
        onDirtyRef.current?.();
        onStrokeEndRef.current?.();
      },
      undo() {
        const prev = undoRef.current.pop();
        if (!prev) return;
        bctx.putImageData(prev, 0, 0);
        repaint();
        onDirtyRef.current?.();
        onStrokeEndRef.current?.();
      },
      imageData() {
        return bctx.getImageData(0, 0, BUFFER_SIZE, BUFFER_SIZE);
      },
      snapshot(size = 140) {
        const out = document.createElement("canvas");
        out.width = size;
        out.height = size;
        const octx = out.getContext("2d")!;
        octx.fillStyle = CANVAS_BG;
        octx.fillRect(0, 0, size, size);
        octx.drawImage(buffer, 0, 0, size, size);
        return out.toDataURL("image/png");
      },
    };

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      handleRef.current = null;
      bufferRef.current = null;
    };
  }, [handleRef]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        className="block w-full cursor-crosshair touch-none select-none rounded-md border border-border"
      />
    </div>
  );
}
