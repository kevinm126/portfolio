"use client";

import { useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  /** sizing + shape go here (must establish a square box, e.g. aspect-square w-full) */
  className?: string;
  /** eager-load + high fetch priority (use for the above-the-fold sidebar avatar) */
  priority?: boolean;
};

/**
 * The Luca-style 3D headshot, brought to life: a gentle breathing float,
 * a pulsing sky-blue glow ring, soft bubbles drifting up, and a parallax
 * tilt that leans toward the cursor on hover. Motion is disabled for users
 * who prefer reduced motion (CSS via the global reset, JS via the guard).
 *
 * Uses a plain <img> on purpose: the asset is a small, fixed-size, pre-
 * optimized JPEG, so next/image's optimizer adds fragility with no payoff.
 */
export function AnimatedAvatar({ src, alt, className, priority }: Props) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const prefersReduced = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el || prefersReduced()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 .. 0.5
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) scale(1.03)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = tiltRef.current;
    if (el) el.style.transform = "";
  }, []);

  return (
    <div
      className={cn("group relative select-none [perspective:600px]", className)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <div
        ref={tiltRef}
        className="avatar-tilt h-full w-full transition-transform duration-200 ease-out [transform-style:preserve-3d]"
      >
        <div className="avatar-float h-full w-full">
          <div className="avatar-clip relative h-full w-full overflow-hidden rounded-full border border-border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              fetchPriority={priority ? "high" : undefined}
              className="h-full w-full object-cover [backface-visibility:hidden]"
              style={{ objectPosition: "center 42%" }}
            />
            <span className="avatar-bubble" style={{ left: "27%", width: "6%", animationDelay: "0s" }} />
            <span className="avatar-bubble" style={{ left: "66%", width: "8%", animationDelay: "-2.4s" }} />
            <span className="avatar-bubble" style={{ left: "47%", width: "5%", animationDelay: "-3.8s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
