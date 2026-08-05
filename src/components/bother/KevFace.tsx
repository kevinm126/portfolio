import { useId } from "react";
import type { Tier } from "./engine";

/**
 * Kev's face as a tiny inline SVG — the game's own art instead of a stock
 * emoji. The heavy lids sink as his anger tier climbs, slant when he's
 * angry, and at meltdown the face floods red over gritted teeth. He also
 * blinks, because he is alive and this is his life.
 *
 * Pure and hook-free, so it renders from server and client components alike.
 */

const INK = "#15171c";
const ACCENT = "#d9483b";

/** Extra lid drop per tier, px (baseline is the tier-0 deadpan). */
const LID_DROP = [0, 1.6, 2.8, 3.7] as const;

export function KevFace({ tier = 0 as Tier, size = 18 }: { tier?: Tier; size?: number }) {
  const uid = useId(); // the face renders more than once per page — ids must not collide
  const drop = LID_DROP[tier];
  const slant = tier >= 2 ? 4 : 0; // degrees; inner edges dip when angry

  const eye = (cx: number, rot: number, clipId: string) => (
    <g>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={27} rx={6.3} ry={7.6} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={27} rx={6.3} ry={7.6} fill="#fff" stroke={INK} strokeWidth="1.3" />
      <circle cx={cx} cy={29.6} r="1.8" fill={INK} />
      <g clipPath={`url(#${clipId})`}>
        <g
          style={{
            transform: `translateY(${drop}px) rotate(${rot}deg)`,
            transformOrigin: `${cx}px 27px`,
            transition: "transform 300ms ease",
          }}
        >
          <rect x={cx - 8.5} y={11.5} width={17} height={14.3} fill="#fff" />
          <line x1={cx - 8.5} y1={25.8} x2={cx + 8.5} y2={25.8} stroke={INK} strokeWidth="1.5" />
        </g>
      </g>
      <ellipse cx={cx} cy={27} rx={6.3} ry={7.6} fill="none" stroke={INK} strokeWidth="1.3" />
    </g>
  );

  return (
    <svg
      width={size}
      height={size * (56 / 48)}
      viewBox="0 0 48 56"
      aria-hidden
      style={{ display: "block" }}
    >
      <style>{`
        @keyframes kev-face-blink {
          0%, 93%, 100% { transform: scaleY(1); }
          95%, 98% { transform: scaleY(0.12); }
        }
      `}</style>
      <defs>
        <clipPath id={`${uid}-skull`}>
          <ellipse cx={24} cy={26} rx={20} ry={23} />
        </clipPath>
      </defs>

      {/* the tie — so there's no mistaking whose face this is */}
      <path d="M20.5 47.5 L27.5 47.5 L26 51.5 L22 51.5 Z" fill={ACCENT} stroke={INK} strokeWidth="1.1" />
      <path d="M22.2 51.5 L25.8 51.5 L24 56 Z" fill={ACCENT} stroke={INK} strokeWidth="1.1" />

      {/* the egg */}
      <ellipse cx={24} cy={26} rx={20} ry={23} fill="#fff" stroke={INK} strokeWidth="1.7" />
      {tier >= 3 && (
        <g clipPath={`url(#${uid}-skull)`}>
          <rect x={4} y={25} width={40} height={26} fill="rgba(217,72,59,0.3)" />
        </g>
      )}

      {/* the exhausted pair, blinking on a shared clock */}
      <g style={{ animation: "kev-face-blink 4.6s infinite", transformOrigin: "24px 27px" }}>
        {eye(16.5, slant, `${uid}-eye-l`)}
        {eye(31.5, -slant, `${uid}-eye-r`)}
      </g>

      {/* the mouth barely exists — until it's teeth */}
      {tier === 3 ? (
        <g>
          <rect x={18.5} y={39} width={11} height={4.6} rx={1.2} fill="#fff" stroke={INK} strokeWidth="1.2" />
          <line x1={22.2} y1={39} x2={22.2} y2={43.6} stroke={INK} strokeWidth="0.9" />
          <line x1={25.8} y1={39} x2={25.8} y2={43.6} stroke={INK} strokeWidth="0.9" />
        </g>
      ) : tier === 2 ? (
        <path d="M20.5 43 Q24 40.4 27.5 43" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <line
          x1={24 - (tier === 1 ? 3.8 : 3.2)}
          y1={41}
          x2={24 + (tier === 1 ? 3.8 : 3.2)}
          y2={41}
          stroke={INK}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
