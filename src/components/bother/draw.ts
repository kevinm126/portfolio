/**
 * Bother Kev — all canvas rendering. Flat vector art modeled on "The
 * Introverted Attorney": an enormous bald egg head, huge heavy-lidded oval
 * eyes in a permanent exhausted deadpan, no nose, a tiny mouth, stick-thin
 * limbs — and one red tie. The office stays near-monochrome; the tie is the
 * only standing colour, and the meltdown's red screen/face-flush remains the
 * only other time colour enters the room.
 *
 * Poses are authored in "unit" coords (head radius 24) and drawn through
 * ctx.scale(K, K) — see engine.ts.
 */

import {
  VIEW_W,
  VIEW_H,
  FLOOR_Y,
  CEIL_Y,
  CABLE_JACK,
  CHAIR_SEAT_Y,
  DESK,
  KEYBOARD,
  MONITOR,
  PROP_R,
  SEAT_X,
  SEAT_HEAD_X,
  SEAT_HEAD_Y,
  K,
  type Guy,
  type Particle,
  type Prop,
  type Tier,
} from "./engine";

export type FaceMood = "normal" | "worried" | "dazed" | "happy";

export type RenderState = {
  t: number;
  guy: Guy;
  grabTilt: number;
  tier: Tier;
  face: FaceMood;
  incidents: number; // today's tally for the whiteboard
  lifetimeIncidents: number; // small, damning second line
  particles: Particle[];
  props: Prop[];
  bubble: { text: string; x: number; y: number } | null;
  /** Spreadsheet progress bar on the monitor. */
  rows: { done: number; target: number };
  /** Seconds remaining of the fourth-wall stare (0 = none). */
  stare: number;
  /** 0..1 duck intensity — he's bracing away from your cursor. */
  flinch: number;
  /** The ethernet cable's state during the meltdown window. */
  cable: { armed: boolean; pulled: boolean };
  /** When set, the whiteboard shows this instead of the tally. */
  confession: string | null;
  lightSwing: number;
  /** Light flicker time remaining, seconds. >0 makes the tube stutter. */
  lightFlicker: number;
  /** Poster lean: transient swing + whatever crookedness has accumulated. */
  posterTilt: number;
  /** Plant jiggle amplitude, decaying. */
  plantWob: number;
  /** 0→1 progress through the current transition pose (rising / sitting). */
  transition: number;
  screen: { mode: "work" | "compose" | "sent" | "off"; composeT: number };
  shake: number;
  clockH: number;
  clockM: number;
};

/* ── palette: grayscale, plus one red reserved for the meltdown ─────── */
const INK = "#15171c";
const WALL = "#f4f5f7";
const WALL_TOP = "#e7e9ec";
const BASEBOARD = "#c8ccd2";
const FLOOR = "#dcdee2";
const FLOOR_LINE = "#c1c5cb";
const DESK_TOP = "#5c616a";
const DESK_FACE = "#474c54";
const DESK_DARK = "#383c43";
const METAL = "#9aa0a8";
const PAPER = "#ffffff";
const SKIN = "#ffffff";
const SHIRT = "#ffffff";
const SHADE = "#d8dbe0";
const PANTS = "#2c3038";
const SHOE = "#15171c";
const ACCENT = "#d9483b"; // the tie — and the meltdown

/* ── tiny helpers ─────────────────────────────────────────────────── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function inked(ctx: CanvasRenderingContext2D, fill: string, lw = 2.4) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.stroke();
}

/** Outlined curved limb (elbow/knee bend via a control point). */
function curveLimb(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  w: number,
  color: string
) {
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.strokeStyle = INK;
  ctx.lineWidth = w + 4;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function hand(ctx: CanvasRenderingContext2D, x: number, y: number, r = 6) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  inked(ctx, SKIN, 2.2);
}

function shoeAt(ctx: CanvasRenderingContext2D, x: number, y: number, dir = 1) {
  ctx.beginPath();
  ctx.ellipse(x + dir * 2, y, 10, 5.5, 0, 0, Math.PI * 2);
  inked(ctx, SHOE, 2);
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.42;
    const a = (i * Math.PI) / 4 - Math.PI / 2;
    ctx[i === 0 ? "moveTo" : "lineTo"](x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

const blinkAt = (t: number) => t % 3.7 < 0.12;

/* ── the head (shared by every pose; unit coords, R≈24) ────────────── */
/** facing 0 = looking straight at the viewer (the stare). */
type FaceOpts = { tier: Tier; mood: FaceMood; blink: boolean; facing: 1 | -1 | 0 };

/**
 * One eye of the exhausted pair: a big white oval, a heavy upper lid drawn
 * as a flat fill + line, and a small low pupil. `lid` is 0..1 closed-ness;
 * `tilt` slants the lid line (inner edge down = angry).
 */
function eye(
  ctx: CanvasRenderingContext2D,
  ex: number,
  ey: number,
  rx: number,
  ry: number,
  lid: number,
  tilt: number,
  pupilDx: number,
  k: number
) {
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  inked(ctx, PAPER, 2 * k);
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  if (lid >= 1) {
    // full blink: the lid swallows the eye
    ctx.fillStyle = SKIN;
    ctx.fillRect(ex - rx - 2, ey - ry - 2, rx * 2 + 4, ry * 2 + 4);
  } else {
    // pupil sits low — he is looking at nothing in particular
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(ex + pupilDx, ey + ry * 0.34, Math.min(rx, ry) * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // heavy upper lid, slanted by mood
    const lidY = ey - ry + lid * ry * 2;
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.moveTo(ex - rx - 2, lidY - tilt);
    ctx.lineTo(ex + rx + 2, lidY + tilt);
    ctx.lineTo(ex + rx + 2, ey - ry - 4);
    ctx.lineTo(ex - rx - 2, ey - ry - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2 * k;
    ctx.beginPath();
    ctx.moveTo(ex - rx - 1, lidY - tilt);
    ctx.lineTo(ex + rx + 1, lidY + tilt);
    ctx.stroke();
  }
  ctx.restore();
  // re-ink the rim so the lid fill doesn't erase the outline
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2 * k;
  ctx.beginPath();
  ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function head(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, f: FaceOpts) {
  const k = R / 24;
  const dx = f.facing * 2.5 * k; // eyes drift toward where he's looking

  // the skull: a big bald egg, slightly taller than wide
  const RX = R * 1.04;
  const RY = R * 1.22;
  ctx.beginPath();
  ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2);
  inked(ctx, SKIN, 2.6 * k);

  // red only ever floods the face when he has had enough
  if (f.tier >= 3 && f.mood === "normal") {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(217,72,59,0.30)";
    ctx.fillRect(cx - RX, cy - RY * 0.05, RX * 2, RY * 2);
    ctx.restore();
  }

  // the eyes: two huge ovals nearly touching, low on the face
  const eyeY = cy + 2 * k;
  const eRx = 8.6 * k;
  const eRy = 10.4 * k;
  const eL = cx - 8.8 * k + dx;
  const eR = cx + 8.8 * k + dx;
  const mouthY = cy + RY * 0.62;

  ctx.lineCap = "round";

  if (f.mood === "dazed") {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.8 * k;
    for (const ex of [eL, eR]) {
      ctx.beginPath();
      ctx.moveTo(ex - 5 * k, eyeY - 5 * k);
      ctx.lineTo(ex + 5 * k, eyeY + 5 * k);
      ctx.moveTo(ex + 5 * k, eyeY - 5 * k);
      ctx.lineTo(ex - 5 * k, eyeY + 5 * k);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 6 * k + dx, mouthY);
    ctx.quadraticCurveTo(cx - 1 * k + dx, mouthY - 4 * k, cx + 2 * k + dx, mouthY);
    ctx.quadraticCurveTo(cx + 5 * k + dx, mouthY + 4 * k, cx + 8 * k + dx, mouthY);
    ctx.stroke();
    return;
  }

  if (f.mood === "worried") {
    // lids gone: the eyes go fully round, pupils shrink to pinpricks
    for (const ex of [eL, eR]) {
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eRx, eRy, 0, 0, Math.PI * 2);
      inked(ctx, PAPER, 2 * k);
    }
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(eL + dx * 0.4, eyeY + 1 * k, 1.9 * k, 0, Math.PI * 2);
    ctx.arc(eR + dx * 0.4, eyeY + 1 * k, 1.9 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + dx, mouthY, 3.2 * k, 4 * k, 0, 0, Math.PI * 2);
    inked(ctx, INK, 1.5 * k);
    return;
  }

  if (f.mood === "happy") {
    // contentment, attorney-style: lids simply lowered all the way, gently
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6 * k;
    for (const ex of [eL, eR]) {
      ctx.beginPath();
      ctx.arc(ex, eyeY - 1 * k, 6.5 * k, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx + dx, mouthY - 3 * k, 5.5 * k, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
    return;
  }

  // normal: the tier sets how far the lids have given up
  //   0 content-ish deadpan · 1 flatter · 2 angry slant · 3 meltdown
  const lid = f.blink ? 1 : f.tier === 0 ? 0.42 : f.tier === 1 ? 0.52 : 0.58;
  const tilt = f.tier >= 2 ? 3.4 * k : 0;
  eye(ctx, eL, eyeY, eRx, eRy, lid, tilt, dx * 0.4, k);
  eye(ctx, eR, eyeY, eRx, eRy, lid, -tilt, dx * 0.4, k);

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4 * k;
  if (f.tier === 3) {
    // small gritted teeth — fury at deadpan scale
    rr(ctx, cx - 7 * k + dx, mouthY - 3 * k, 14 * k, 6.5 * k, 1.5 * k);
    inked(ctx, PAPER, 1.8 * k);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4 * k;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
      ctx.moveTo(cx - 7 * k + dx + i * 3.5 * k, mouthY - 3 * k);
      ctx.lineTo(cx - 7 * k + dx + i * 3.5 * k, mouthY + 3.5 * k);
    }
    ctx.stroke();
  } else {
    // the mouth barely exists
    ctx.beginPath();
    if (f.tier === 2) {
      ctx.arc(cx + dx, mouthY + 4.5 * k, 4.5 * k, Math.PI * 1.25, Math.PI * 1.75);
    } else {
      ctx.moveTo(cx - 3.5 * k + dx, mouthY);
      ctx.lineTo(cx + 3.5 * k + dx, mouthY);
    }
    ctx.stroke();
  }
}

/**
 * White shirt with THE red tie. `tieLean` skews the tie's tail sideways
 * (velocity while flying, a slight sway while dangling); 0 hangs straight.
 */
function torso(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  h: number,
  w = 24,
  tieLean = 0
) {
  rr(ctx, cx - w / 2, topY, w, h, 9);
  inked(ctx, SHIRT, 2.6);
  // collar
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 5, topY + 1);
  ctx.lineTo(cx, topY + 6);
  ctx.lineTo(cx + 5, topY + 1);
  ctx.stroke();
  // the tie: knot + tapered tail, the one thing about him with any colour
  const tw = Math.min(7, w * 0.3);
  const tl = h * 0.58;
  ctx.fillStyle = ACCENT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - tw * 0.45, topY + 5);
  ctx.lineTo(cx + tw * 0.45, topY + 5);
  ctx.lineTo(cx + tw * 0.62 + tieLean * 0.4, topY + 8.5);
  ctx.lineTo(cx - tw * 0.62 + tieLean * 0.4, topY + 8.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - tw * 0.5 + tieLean * 0.4, topY + 8.5);
  ctx.lineTo(cx + tw * 0.5 + tieLean * 0.4, topY + 8.5);
  ctx.lineTo(cx + tw * 0.7 + tieLean, topY + 8.5 + tl * 0.7);
  ctx.lineTo(cx + tieLean * 1.3, topY + 8.5 + tl);
  ctx.lineTo(cx - tw * 0.7 + tieLean, topY + 8.5 + tl * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ── seated: profile, facing right, hands on the keys ──────────────── */

/** Hand height on the keys, per hand, in unit coords. */
function typingHands(s: RenderState) {
  const fast = s.screen.mode === "compose";
  const speed = fast ? 26 : 11;
  const lift = fast ? 5 : 3.4;
  const keyY = (DESK.top - 10 - CHAIR_SEAT_Y) / K; // unit y of the key tops
  return {
    near: { x: 60, y: keyY - Math.max(0, Math.sin(s.t * speed)) * lift },
    far: { x: 43, y: keyY - 5 - Math.max(0, Math.sin(s.t * speed + Math.PI)) * lift },
    fast,
  };
}

/**
 * Seated at the desk. `settle` < 1 lowers him into the chair (he arrives from
 * standing, so he descends the last stretch rather than snapping into place)
 * and holds his hands off the keys until he's actually down.
 */
export function drawSeated(ctx: CanvasRenderingContext2D, s: RenderState, settle = 1) {
  const staring = s.stare > 0;
  const h = typingHands(s);
  const breathe = s.screen.mode === "compose" || staring ? 0 : Math.sin(s.t * 2.2) * 0.8;
  const jitter = s.screen.mode === "compose" ? Math.sin(s.t * 38) * 0.7 : 0;
  const drop = (1 - settle) * 38;
  // bracing: head down, shoulders up, hands pulled slightly off the keys
  const duck = s.flinch * (staring ? 0 : 1);
  // hands reach for the keys only as he lands
  h.near.y -= drop * 0.5;
  h.far.y -= drop * 0.5;
  if (staring) {
    // hands come off the keys and rest at the desk edge — total stillness
    h.near = { x: 40, y: -14 };
    h.far = { x: 30, y: -16 };
    h.fast = false;
  }

  ctx.save();
  ctx.translate(SEAT_X + jitter, CHAIR_SEAT_Y - drop);
  ctx.scale(K, K);

  // far leg first (lighter, sits behind): thigh along the seat, shin straight down
  curveLimb(ctx, 0, 1, 16, -1, 30, 1, 7, SHADE);
  curveLimb(ctx, 30, 1, 34, 22, 32, 45, 7, SHADE);
  shoeAt(ctx, 34, 46);

  // near leg: knee squarely bent over the seat edge
  curveLimb(ctx, 2, 4, 20, 2, 36, 4, 8, PANTS);
  curveLimb(ctx, 36, 4, 40, 26, 38, 45, 8, PANTS);
  shoeAt(ctx, 40, 46);

  torso(ctx, 2, -46 + breathe + duck * 3, 50, 22);

  // far arm reaching for the keys
  curveLimb(ctx, 1, -38 + breathe, 24, -26, h.far.x, h.far.y + duck * 2, 6, SHADE);
  hand(ctx, h.far.x, h.far.y + duck * 2, 5);

  // The stare: the only moment he ever faces the viewer. One blink, no words.
  head(ctx, 9 - duck * 2, -74 + breathe + duck * 6, 24, {
    tier: staring ? 1 : s.tier,
    mood: staring ? "normal" : s.face,
    blink: staring ? s.stare < 1.7 && s.stare > 1.55 : blinkAt(s.t),
    facing: staring ? 0 : 1,
  });

  // near arm, drawn over the head-side so it reads as the closer arm
  curveLimb(ctx, 4, -36 + breathe, 28, -22, h.near.x, h.near.y + duck * 2, 7, SHIRT);
  hand(ctx, h.near.x, h.near.y + duck * 2, 5.8);

  // motion ticks over the hands while he's hammering the keys
  if (h.fast && settle >= 1) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(s.t * 30);
    ctx.beginPath();
    for (const hx of [h.near.x, h.far.x]) {
      ctx.moveTo(hx - 4, h.near.y - 11);
      ctx.lineTo(hx - 6, h.near.y - 15);
      ctx.moveTo(hx + 4, h.near.y - 11);
      ctx.lineTo(hx + 6, h.near.y - 15);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/**
 * The cable was pulled mid-email. He doesn't rage — he folds forward and
 * puts his head down on the desk. You only see the top of his head.
 */
export function drawDespair(ctx: CanvasRenderingContext2D, s: RenderState) {
  ctx.save();
  ctx.translate(SEAT_X, CHAIR_SEAT_Y);
  ctx.scale(K, K);

  // legs, same as seated
  curveLimb(ctx, 0, 1, 16, -1, 30, 1, 7, SHADE);
  curveLimb(ctx, 30, 1, 34, 22, 32, 45, 7, SHADE);
  shoeAt(ctx, 34, 46);
  curveLimb(ctx, 2, 4, 20, 2, 36, 4, 8, PANTS);
  curveLimb(ctx, 36, 4, 40, 26, 38, 45, 8, PANTS);
  shoeAt(ctx, 40, 46);

  // torso folded forward over the desk edge
  ctx.save();
  ctx.rotate(0.62);
  rr(ctx, -13, -56, 26, 58, 10);
  inked(ctx, SHIRT, 2.6);
  ctx.restore();

  // forearms flat on the desktop, one over the other
  const deskY = (DESK.top - 10 - CHAIR_SEAT_Y) / K;
  curveLimb(ctx, 22, -28, 40, deskY - 4, 58, deskY - 2, 6.5, SHADE);
  hand(ctx, 58, deskY - 2, 5);
  curveLimb(ctx, 26, -24, 44, deskY - 8, 62, deskY - 7, 7, SHIRT);
  hand(ctx, 62, deskY - 7, 5.5);

  // the bald egg, face-down on the arms — no face at all, just the crown
  const hx = 46;
  const hy = deskY - 16 + Math.sin(s.t * 1.1) * 0.6; // slow, heavy breathing
  ctx.beginPath();
  ctx.ellipse(hx, hy, 23, 21, 0.2, 0, Math.PI * 2);
  inked(ctx, SKIN, 2.6);

  ctx.restore();
}

/* ── other poses ──────────────────────────────────────────────────── */

/** Dangling from the pointer (grabbed by the scruff). */
function drawDangle(ctx: CanvasRenderingContext2D, s: RenderState) {
  const g = s.guy;
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(Math.sin(s.t * 3.2) * 0.1 + s.grabTilt);
  ctx.scale(K, K);

  const kick = Math.sin(s.t * 11);
  curveLimb(ctx, -5, 40, -9, 52, -11 + kick * 9, 66, 7, PANTS);
  curveLimb(ctx, 5, 40, 9, 52, 11 - kick * 9, 66, 7, PANTS);
  shoeAt(ctx, -11 + kick * 9, 68);
  shoeAt(ctx, 11 - kick * 9, 68);
  torso(ctx, 0, 12, 30, 22, Math.sin(s.t * 3.2) * 3);
  curveLimb(ctx, -10, 18, -20, 8, -25, 4 + kick * 5, 6.5, SHIRT);
  curveLimb(ctx, 10, 18, 20, 8, 25, 4 - kick * 5, 6.5, SHIRT);
  hand(ctx, -25, 4 + kick * 5, 5.2);
  hand(ctx, 25, 4 - kick * 5, 5.2);
  head(ctx, 0, -14, 24, { tier: s.tier, mood: "worried", blink: false, facing: g.facing });
  ctx.restore();
}

/** Tumbling through the air. Origin = body center. */
function drawFly(ctx: CanvasRenderingContext2D, s: RenderState) {
  const g = s.guy;
  ctx.save();
  ctx.translate(g.x, g.y);
  // Impact squash applied in world space, before the tumble rotation, so a
  // floor hit always pancakes him downward however he happens to be spinning.
  ctx.scale(1 + g.squash * 0.65, 1 - g.squash * 0.65);
  ctx.rotate(g.rot);
  ctx.scale(K, K);
  const fl = Math.sin(s.t * 22);
  const tieLean = Math.max(-9, Math.min(9, -g.vx * 0.006));

  curveLimb(ctx, -5, 14, -12, 24, -18, 32 + fl * 6, 7, PANTS);
  curveLimb(ctx, 5, 14, 14, 22, 20, 30 - fl * 6, 7, PANTS);
  shoeAt(ctx, -18, 34 + fl * 6, -1);
  shoeAt(ctx, 20, 32 - fl * 6);
  torso(ctx, 0, -14, 30, 22, tieLean);
  curveLimb(ctx, -10, -8, -20, -16, -26, -20 - fl * 5, 6.5, SHIRT);
  curveLimb(ctx, 10, -8, 20, -14, 26, -18 + fl * 5, 6.5, SHIRT);
  hand(ctx, -26, -20 - fl * 5, 5.2);
  hand(ctx, 26, -18 + fl * 5, 5.2);
  head(ctx, 0, -40, 24, { tier: s.tier, mood: "worried", blink: false, facing: g.facing });
  ctx.restore();
}

/** Flat on his back, limbs splayed, seeing stars. */
function drawLie(ctx: CanvasRenderingContext2D, s: RenderState) {
  const g = s.guy;
  const dir = g.facing;
  ctx.save();
  ctx.translate(g.x, FLOOR_Y);
  ctx.scale(dir * K, K);

  // far limbs first
  curveLimb(ctx, 22, -13, 44, -5, 64, -9, 8, SHADE);
  shoeAt(ctx, 67, -9);
  curveLimb(ctx, -6, -14, -16, -6, -22, -3, 7, SHADE);
  hand(ctx, -22, -3, 5.2);

  // torso, lying flat
  rr(ctx, -14, -34, 44, 29, 13);
  inked(ctx, SHIRT, 2.6);
  // the tie, flopped sideways across his chest
  ctx.fillStyle = ACCENT;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.lineTo(-3, -32);
  ctx.lineTo(14, -24);
  ctx.lineTo(12, -16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // near leg, knee flopped up
  curveLimb(ctx, 24, -24, 46, -36, 62, -25, 9, PANTS);
  shoeAt(ctx, 65, -24);
  // near arm, thrown back over his head
  curveLimb(ctx, -8, -30, 0, -48, 6, -52, 7, SHIRT);
  hand(ctx, 6, -53, 5.8);

  head(ctx, -42, -23, 24, { tier: s.tier, mood: "dazed", blink: false, facing: 1 });
  ctx.restore();

  // orbiting stars, drawn unflipped and outlined so they read on the pale wall
  const hx = g.x + dir * -40 * K;
  const hy = FLOOR_Y - 21 * K;
  for (let i = 0; i < 3; i++) {
    const a = s.t * 2.6 + (i * Math.PI * 2) / 3;
    const sx = hx + Math.cos(a) * 46;
    const sy = hy - 46 + Math.sin(a) * 11;
    star(ctx, sx, sy, 10, PAPER);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    star(ctx, sx, sy, 5, INK);
  }
}

/**
 * Standing figure — walking, or peeling off the floor when `rise` < 1.
 * At rise 0 he is flat on his back; the pivot is his feet, so he swings up
 * onto them instead of teleporting upright.
 */
function drawWalk(
  ctx: CanvasRenderingContext2D,
  s: RenderState,
  storming: boolean,
  rise = 1
) {
  const g = s.guy;
  const ph = g.walkPhase;
  const swing = Math.sin(ph) * 0.62;
  const bob = Math.abs(Math.sin(ph)) * 2.2;
  ctx.save();
  ctx.translate(g.x, g.y - bob * K);
  if (rise < 1) {
    // pivot about the feet, and stay a little crouched until he's fully up
    ctx.rotate(-g.facing * (1 - rise) * 1.34);
    const crouch = 0.82 + 0.18 * rise;
    ctx.scale(1, crouch);
  }
  ctx.scale(g.facing * K, K);
  if (storming) ctx.rotate(0.09);

  const hipY = -54;
  const lx = Math.sin(swing) * 16;
  const ly = hipY + Math.cos(swing) * 54;
  const rx = Math.sin(-swing) * 16;
  const ry = hipY + Math.cos(-swing) * 54;
  curveLimb(ctx, -5, hipY, -5 + lx * 0.6, hipY + 28, -5 + lx, ly, 8, SHADE);
  shoeAt(ctx, -5 + lx + 3, ly + 2);
  curveLimb(ctx, 5, hipY, 5 + rx * 0.6, hipY + 28, 5 + rx, ry, 9, PANTS);
  shoeAt(ctx, 5 + rx + 3, ry + 2);

  torso(ctx, 0, -104, 52, 26, storming ? -4 : 0);

  if (storming) {
    // fists pumping
    curveLimb(ctx, -12, -94, -22, -102, -24, -112, 7, SHIRT);
    curveLimb(ctx, 12, -94, 22, -88, 24, -76, 7.5, SHIRT);
    hand(ctx, -24, -114, 6);
    hand(ctx, 24, -74, 6);
  } else {
    const a1 = -Math.sin(swing) * 15;
    const a2 = Math.sin(swing) * 15;
    curveLimb(ctx, -12, -94, -17, -80, -12 + a1, -62, 6.5, SHADE);
    curveLimb(ctx, 12, -94, 17, -80, 12 + a2, -62, 7.5, SHIRT);
    hand(ctx, -12 + a1, -62, 5);
    hand(ctx, 12 + a2, -62, 5.8);
  }

  // standing, the egg reads bigger — reference proportions are ~45% head
  head(ctx, 2, -138, 28, {
    tier: storming ? 3 : s.tier,
    mood: s.face,
    blink: blinkAt(s.t),
    facing: 1,
  });
  ctx.restore();
}

/* ── office ───────────────────────────────────────────────────────── */

function drawRoom(ctx: CanvasRenderingContext2D) {
  // Painted past the view on every side so screen shake never exposes a
  // bare canvas edge.
  const PAD = 12;
  ctx.fillStyle = WALL;
  ctx.fillRect(-PAD, -PAD, VIEW_W + PAD * 2, FLOOR_Y + PAD);
  ctx.fillStyle = WALL_TOP;
  ctx.fillRect(-PAD, -PAD, VIEW_W + PAD * 2, CEIL_Y - 14 + PAD);
  ctx.fillStyle = BASEBOARD;
  ctx.fillRect(0, FLOOR_Y - 12, VIEW_W, 12);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y - 12);
  ctx.lineTo(VIEW_W, FLOOR_Y - 12);
  ctx.stroke();

  ctx.fillStyle = FLOOR;
  ctx.fillRect(-12, FLOOR_Y, VIEW_W + 24, VIEW_H - FLOOR_Y + 12);
  ctx.strokeStyle = FLOOR_LINE;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 2; i++) {
    const y = FLOOR_Y + 24 + i * 24;
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW_W, y);
  }
  for (let x = 40; x < VIEW_W; x += 96) {
    ctx.moveTo(x, FLOOR_Y);
    ctx.lineTo(x, FLOOR_Y + 24);
    ctx.moveTo(x + 48, FLOOR_Y + 24);
    ctx.lineTo(x + 48, FLOOR_Y + 48);
  }
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(VIEW_W, FLOOR_Y);
  ctx.stroke();
}

function drawWindow(ctx: CanvasRenderingContext2D, t: number) {
  const x = 62,
    y = 96,
    w = 186,
    h = 182;
  ctx.save();
  rr(ctx, x, y, w, h, 5);
  ctx.clip();
  ctx.fillStyle = "#eef0f3";
  ctx.fillRect(x, y, w, h);
  // skyline in flat grays
  ctx.fillStyle = "#b9bec5";
  [24, 60, 36, 72, 48].forEach((bh, i) => ctx.fillRect(x + i * 40 - 4, y + h - bh - 26, 34, bh + 26));
  ctx.fillStyle = "#a1a7af";
  ctx.fillRect(x, y + h - 28, w, 28);
  // drifting clouds
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 2; i++) {
    const cx = x + ((t * 9 + i * 130) % (w + 90)) - 45;
    const cy = y + 34 + i * 42;
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.arc(cx + 14, cy - 6, 10, 0, Math.PI * 2);
    ctx.arc(cx + 27, cy, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  rr(ctx, x, y, w, h, 5);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w / 2, y + h);
  ctx.moveTo(x, y + h / 2);
  ctx.lineTo(x + w, y + h / 2);
  ctx.stroke();
  rr(ctx, x - 10, y + h, w + 20, 11, 3);
  inked(ctx, BASEBOARD, 2.4);
}

function drawPoster(ctx: CanvasRenderingContext2D, tilt = 0) {
  const x = 296,
    y = 112,
    w = 104,
    h = 134;
  ctx.save();
  // hangs from its top-center pin, so impact swings pivot naturally
  ctx.translate(x + w / 2, y);
  ctx.rotate(0.02 + tilt);
  ctx.translate(-(x + w / 2), -y);
  rr(ctx, x, y, w, h, 3);
  inked(ctx, PAPER, 2.6);

  // blob cat hanging from a bar
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 40);
  ctx.lineTo(x + w - 18, y + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + 62, 16, 20, 0, 0, Math.PI * 2);
  inked(ctx, SHADE, 2.2);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 44, 11, 0, Math.PI * 2);
  inked(ctx, SHADE, 2.2);
  ctx.fillStyle = SHADE;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 9, y + 37);
  ctx.lineTo(x + w / 2 - 5, y + 27);
  ctx.lineTo(x + w / 2 - 1, y + 35);
  ctx.moveTo(x + w / 2 + 9, y + 37);
  ctx.lineTo(x + w / 2 + 5, y + 27);
  ctx.lineTo(x + w / 2 + 1, y + 35);
  ctx.fill();
  ctx.fillRect(x + w / 2 - 13, y + 37, 6, 7);
  ctx.fillRect(x + w / 2 + 7, y + 37, 6, 7);
  ctx.strokeRect(x + w / 2 - 13, y + 37, 6, 7);
  ctx.strokeRect(x + w / 2 + 7, y + 37, 6, 7);
  ctx.fillStyle = INK;
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("HANG IN", x + w / 2, y + 104);
  ctx.fillText("THERE.", x + w / 2, y + 119);
  ctx.textAlign = "left";
  ctx.restore();
}

function drawClock(ctx: CanvasRenderingContext2D, s: RenderState) {
  const x = 466,
    y = 128,
    r = 30;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  inked(ctx, PAPER, 4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  for (let i = 0; i < 12; i += 3) {
    const a = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (r - 5), y + Math.sin(a) * (r - 5));
    ctx.lineTo(x + Math.cos(a) * (r - 10), y + Math.sin(a) * (r - 10));
    ctx.stroke();
  }
  const mA = (s.clockM / 60) * Math.PI * 2 - Math.PI / 2;
  const hA = (((s.clockH % 12) + s.clockM / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const sA = ((s.t % 60) / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.lineCap = "round";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hA) * (r - 15), y + Math.sin(hA) * (r - 15));
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(mA) * (r - 9), y + Math.sin(mA) * (r - 9));
  ctx.stroke();
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(sA) * (r - 8), y + Math.sin(sA) * (r - 8));
  ctx.stroke();
}

function drawWhiteboard(ctx: CanvasRenderingContext2D, s: RenderState) {
  const x = 566,
    y = 84,
    w = 316,
    h = 132;
  rr(ctx, x, y, w, h, 3);
  inked(ctx, PAPER, 5);
  rr(ctx, x + 40, y + h + 2, w - 80, 9, 3);
  inked(ctx, BASEBOARD, 2.2);

  // sometimes the board shows what everyone else confessed instead
  if (s.confession) {
    ctx.fillStyle = INK;
    ctx.font = "800 15px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("MEANWHILE:", x + 16, y + 30);
    ctx.font = "700 16px system-ui, sans-serif";
    const words = s.confession.split(" ");
    let line = "";
    let ly = y + 62;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > w - 32 && line) {
        ctx.fillText(line, x + 16, ly);
        ly += 24;
        line = word;
      } else line = test;
    }
    ctx.fillText(line, x + 16, ly);
    return;
  }

  ctx.fillStyle = INK;
  ctx.font = "800 15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("INCIDENTS TODAY:", x + 16, y + 30);
  if (s.lifetimeIncidents > s.incidents) {
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.fillStyle = "#6b7178";
    ctx.textAlign = "right";
    ctx.fillText(`(lifetime: ${s.lifetimeIncidents})`, x + w - 14, y + 30);
    ctx.textAlign = "left";
    ctx.fillStyle = INK;
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  const n = Math.min(s.incidents, 45);
  for (let i = 0; i < n; i++) {
    const group = Math.floor(i / 5);
    const inGroup = i % 5;
    const gx = x + 20 + (group % 7) * 42;
    const gy = y + 48 + Math.floor(group / 7) * 36;
    ctx.beginPath();
    if (inGroup < 4) {
      ctx.moveTo(gx + inGroup * 7, gy);
      ctx.lineTo(gx + inGroup * 7, gy + 22);
    } else {
      ctx.moveTo(gx - 5, gy + 18);
      ctx.lineTo(gx + 26, gy + 4);
    }
    ctx.stroke();
  }
  if (s.incidents > 45) {
    ctx.fillStyle = INK;
    ctx.font = "700 13px system-ui, sans-serif";
    ctx.fillText("…I ran out of board", x + 16, y + h - 12);
  }
}

function drawCabinet(ctx: CanvasRenderingContext2D) {
  const x = 120,
    w = 92,
    top = FLOOR_Y - 130;
  rr(ctx, x, top, w, 130, 4);
  inked(ctx, SHADE, 2.8);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, top + i * 43);
    ctx.lineTo(x + w, top + i * 43);
    ctx.stroke();
  }
  ctx.fillStyle = INK;
  for (let i = 0; i < 3; i++) {
    rr(ctx, x + w / 2 - 13, top + 20 + i * 43, 26, 6, 3);
    ctx.fill();
  }
}

function drawPlant(ctx: CanvasRenderingContext2D, t = 0, wob = 0) {
  const x = 906,
    y = FLOOR_Y;
  const sway = wob > 0.01 ? Math.sin(t * 17) * wob * 0.12 : 0;
  for (const [dx, dy, rx, ry, rot] of [
    [-16, -60, 9, 28, -0.5],
    [14, -62, 9, 30, 0.45],
    [0, -74, 9, 34, 0],
    [-8, -54, 8, 24, -0.2],
    [8, -54, 8, 24, 0.2],
  ] as const) {
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.rotate(rot + sway * (1 + Math.abs(dx) / 16));
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    inked(ctx, SHADE, 2.2);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(x - 23, y - 36);
  ctx.lineTo(x + 23, y - 36);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x - 16, y);
  ctx.closePath();
  inked(ctx, METAL, 2.6);
  rr(ctx, x - 24, y - 40, 48, 8, 2);
  inked(ctx, METAL, 2.4);
}

function drawLight(ctx: CanvasRenderingContext2D, s: RenderState) {
  // a rattled tube stutters: strobe the glow, occasionally drop the whole frame's light
  const flickerOff = s.lightFlicker > 0 && Math.sin(s.t * 71) + Math.sin(s.t * 113) > 0.9;
  ctx.save();
  ctx.translate(330, 6);
  ctx.rotate(s.lightSwing);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-90, 0);
  ctx.lineTo(-90, 26);
  ctx.moveTo(90, 0);
  ctx.lineTo(90, 26);
  ctx.stroke();
  rr(ctx, -120, 26, 240, 14, 7);
  inked(ctx, flickerOff ? SHADE : PAPER, 2.6);
  if (!flickerOff) {
    const glow = ctx.createRadialGradient(0, 40, 10, 0, 40, 140);
    glow.addColorStop(0, "rgba(255,255,255,0.55)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 40, 140, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Side-view office chair, drawn behind Kev. */
function drawChair(ctx: CanvasRenderingContext2D) {
  const x = SEAT_X;
  // backrest
  rr(ctx, x - 46, CHAIR_SEAT_Y - 82, 17, 88, 8);
  inked(ctx, DESK_FACE, 2.6);
  // seat
  rr(ctx, x - 44, CHAIR_SEAT_Y - 4, 82, 14, 6);
  inked(ctx, DESK_TOP, 2.6);
  // post + base
  rr(ctx, x - 12, CHAIR_SEAT_Y + 10, 14, 40, 4);
  inked(ctx, METAL, 2.4);
  ctx.beginPath();
  ctx.moveTo(x - 42, FLOOR_Y - 4);
  ctx.lineTo(x + 34, FLOOR_Y - 4);
  ctx.lineTo(x + 24, FLOOR_Y - 14);
  ctx.lineTo(x - 32, FLOOR_Y - 14);
  ctx.closePath();
  inked(ctx, METAL, 2.4);
  for (const wx of [x - 38, x + 30]) {
    ctx.beginPath();
    ctx.arc(wx, FLOOR_Y - 2, 6, 0, Math.PI * 2);
    inked(ctx, DESK_DARK, 2.2);
  }
}

/**
 * The ethernet cable: desk pedestal → floor sag → wall jack. Decoration,
 * until the meltdown arms it and it becomes the other trolley track.
 */
function drawCable(ctx: CanvasRenderingContext2D, s: RenderState) {
  const startX = DESK.x + DESK.w - 54;
  const { x: jx, y: jy } = CABLE_JACK;

  // wall plate
  rr(ctx, jx - 9, jy - 12, 18, 24, 3);
  inked(ctx, SHADE, 2.2);

  ctx.lineCap = "round";
  if (s.cable.pulled) {
    // yanked: the loose end lies on the floor short of the jack
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, FLOOR_Y - 10);
    ctx.quadraticCurveTo((startX + jx) / 2 - 30, FLOOR_Y + 4, jx - 52, FLOOR_Y - 5);
    ctx.stroke();
    rr(ctx, jx - 54, FLOOR_Y - 10, 12, 8, 2);
    inked(ctx, INK, 1.6);
    return;
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(startX, FLOOR_Y - 10);
  ctx.quadraticCurveTo((startX + jx) / 2, FLOOR_Y + 6, jx - 6, jy);
  ctx.stroke();

  if (s.cable.armed) {
    // the window is open: the cable pulses so the choice is visible
    const pulse = 0.45 + 0.4 * Math.sin(s.t * 9);
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(startX, FLOOR_Y - 10);
    ctx.quadraticCurveTo((startX + jx) / 2, FLOOR_Y + 6, jx - 6, jy);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2 + pulse * 1.5;
    ctx.beginPath();
    ctx.arc(jx, jy, 16 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** The desk, seen side-on and facing right. */
function drawDesk(ctx: CanvasRenderingContext2D, s: RenderState) {
  const { x, w, top } = DESK;

  // drawer pedestal at the far end
  rr(ctx, x + w - 100, top + 16, 92, FLOOR_Y - top - 16, 4);
  inked(ctx, DESK_FACE, 2.8);
  for (let i = 0; i < 2; i++) {
    rr(ctx, x + w - 90, top + 30 + i * 40, 72, 32, 4);
    inked(ctx, DESK_DARK, 2.2);
    rr(ctx, x + w - 65, top + 42 + i * 40, 22, 7, 3);
    inked(ctx, METAL, 1.8);
  }
  // Single-pedestal desk: no near leg, so his shins have clear room under it.

  // desktop slab
  rr(ctx, x - 8, top, w + 16, 20, 5);
  inked(ctx, DESK_TOP, 2.8);

  drawMonitor(ctx, s);

  // keyboard, angled toward him
  rr(ctx, KEYBOARD.x, top - 9, KEYBOARD.w, 11, 3);
  inked(ctx, DESK_DARK, 2.2);
  ctx.strokeStyle = METAL;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  for (let i = 1; i < 7; i++) {
    ctx.moveTo(KEYBOARD.x + i * (KEYBOARD.w / 7), top - 8);
    ctx.lineTo(KEYBOARD.x + i * (KEYBOARD.w / 7), top + 1);
  }
  ctx.stroke();

}

/* ── the desk props (live objects — see engine.ts) ─────────────────── */

function drawMug(ctx: CanvasRenderingContext2D, p: Prop, t: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  rr(ctx, -9.5, -12, 19, 24, 3);
  inked(ctx, PAPER, 2.4);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(13.5, -1, 6, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.restore();
  // steam only while it sits at home, unbothered
  if (p.state === "desk") {
    ctx.strokeStyle = "rgba(21,23,28,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 2; i++) {
      const sx = p.x - 3.5 + i * 8;
      ctx.moveTo(sx, p.y - 16);
      ctx.quadraticCurveTo(
        sx + Math.sin(t * 2 + i) * 4,
        p.y - 26,
        sx + Math.sin(t * 1.4 + i) * 3,
        p.y - 34
      );
    }
    ctx.stroke();
  }
}

function drawStapler(ctx: CanvasRenderingContext2D, p: Prop) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  // base
  rr(ctx, -15, 1, 30, 6, 2);
  inked(ctx, DESK_DARK, 2.2);
  // hinged top, resting closed with a slight jaw
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.lineTo(-11, -6);
  ctx.lineTo(13, -3);
  ctx.lineTo(15, 2);
  ctx.closePath();
  inked(ctx, METAL, 2.2);
  ctx.restore();
}

export function drawProps(ctx: CanvasRenderingContext2D, s: RenderState) {
  for (const p of s.props) {
    if (p.state === "broken") continue;
    if (p.kind === "mug") drawMug(ctx, p, s.t);
    else drawStapler(ctx, p);
  }
}

function drawMonitor(ctx: CanvasRenderingContext2D, s: RenderState) {
  const { x, y, w, h } = MONITOR;
  const top = DESK.top;

  // stand
  rr(ctx, x + w / 2 - 13, y + h, 26, top - (y + h), 3);
  inked(ctx, DESK_DARK, 2.4);
  rr(ctx, x + w / 2 - 40, top - 8, 80, 10, 4);
  inked(ctx, DESK_DARK, 2.4);

  // bezel
  rr(ctx, x, y, w, h, 6);
  inked(ctx, DESK_DARK, 3);

  const sx = x + 9,
    sy = y + 9,
    sw = w - 18,
    sh = h - 24;

  if (s.screen.mode === "work") {
    ctx.fillStyle = PAPER;
    ctx.fillRect(sx, sy, sw, sh);
    // spreadsheet grid
    ctx.strokeStyle = "#dfe2e6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let r = 1; r < 7; r++) {
      ctx.moveTo(sx, sy + r * 13);
      ctx.lineTo(sx + sw, sy + r * 13);
    }
    for (let c = 1; c < 5; c++) {
      ctx.moveTo(sx + c * (sw / 5), sy);
      ctx.lineTo(sx + c * (sw / 5), sy + sh);
    }
    ctx.stroke();
    // header row
    ctx.fillStyle = "#d7dade";
    ctx.fillRect(sx, sy, sw, 13);
    ctx.fillStyle = "#6b7178";
    for (let c = 0; c < 5; c++) ctx.fillRect(sx + 5 + c * (sw / 5), sy + 5, sw / 5 - 12, 4);
    // filled rows, the last one still being typed
    const rows = 1 + (Math.floor(s.t * 1.6) % 6);
    for (let r = 0; r < rows; r++) {
      const last = r === rows - 1;
      for (let c = 0; c < 5; c++) {
        if (last && c > (Math.floor(s.t * 8) % 5)) break;
        ctx.fillStyle = c === 0 ? "#8b9199" : "#b4b9c0";
        ctx.fillRect(sx + 4 + c * (sw / 5), sy + 17 + r * 13, sw / 5 - 9, 6);
      }
    }
    // blinking active cell
    if (Math.floor(s.t * 2) % 2 === 0) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(sx + 2, sy + 14 + (rows - 1) * 13, sw / 5 - 5, 11);
    }
    // the quarter's real progress — his life's work, one thin bar
    ctx.fillStyle = "#dfe2e6";
    ctx.fillRect(sx, sy + sh - 5, sw, 5);
    ctx.fillStyle = "#6b7178";
    ctx.fillRect(sx, sy + sh - 5, sw * Math.min(1, s.rows.done / s.rows.target), 5);
  } else if (s.screen.mode === "off") {
    // the cable was pulled — dead glass
    ctx.fillStyle = "#101216";
    ctx.fillRect(sx, sy, sw, sh);
  } else if (s.screen.mode === "compose") {
    ctx.fillStyle = PAPER;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(sx, sy, sw, 13);
    ctx.fillStyle = PAPER;
    ctx.font = "800 8px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("NEW MESSAGE", sx + 5, sy + 9.5);
    ctx.fillStyle = "#6b7178";
    ctx.font = "700 7.5px system-ui, sans-serif";
    ctx.fillText("To: kevin (the real one)", sx + 5, sy + 24);
    ctx.strokeStyle = "#dfe2e6";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sx + 3, sy + 29);
    ctx.lineTo(sx + sw - 3, sy + 29);
    ctx.stroke();
    // lines of fury appearing
    const lines = Math.floor(s.screen.composeT * 7);
    ctx.fillStyle = "#8b9199";
    for (let i = 0; i < lines; i++) {
      const lw = i === lines - 1 ? 22 + ((s.screen.composeT * 7) % 1) * 70 : 66 + ((i * 29) % 34);
      ctx.fillRect(sx + 7, sy + 36 + i * 8, Math.min(lw, sw - 16), 4);
    }
    // send button, flashing as it nears completion
    const hot = s.screen.composeT > 0.85 && Math.floor(s.t * 6) % 2 === 0;
    rr(ctx, sx + sw - 40, sy + sh - 16, 34, 12, 3);
    ctx.fillStyle = hot ? "#ff6a5e" : ACCENT;
    ctx.fill();
    ctx.fillStyle = PAPER;
    ctx.font = "800 7px system-ui, sans-serif";
    ctx.fillText("SEND", sx + sw - 32, sy + sh - 7.5);
  } else {
    ctx.fillStyle = "#1d2026";
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = ACCENT;
    ctx.font = "800 10px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MESSAGE SENT", sx + sw / 2, sy + sh / 2 - 3);
    ctx.fillStyle = "#8b9199";
    ctx.font = "700 8px system-ui, sans-serif";
    ctx.fillText("(a real one)", sx + sw / 2, sy + sh / 2 + 12);
    ctx.textAlign = "left";
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, parts: Particle[]) {
  for (const p of parts) {
    const k = 1 - p.life / p.maxLife;
    if (p.kind === "puff") {
      ctx.fillStyle = `rgba(150,157,166,${0.45 * k})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6 + (1 - k) * 18, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "paper") {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin * p.life);
      ctx.fillStyle = `rgba(255,255,255,${0.95 * k})`;
      ctx.fillRect(-8, -5, 16, 10);
      ctx.strokeStyle = `rgba(21,23,28,${0.75 * k})`;
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-8, -5, 16, 10);
      ctx.restore();
    } else if (p.kind === "star") {
      star(ctx, p.x, p.y, 6 * k + 2, `rgba(21,23,28,${k})`);
    } else if (p.kind === "shard") {
      // ceramic chips: small white triangles tumbling with an ink edge
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin * p.life * 2);
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.lineTo(5, 2);
      ctx.lineTo(0, -6);
      ctx.closePath();
      ctx.fillStyle = `rgba(255,255,255,${0.95 * k})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(21,23,28,${0.8 * k})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    } else if (p.kind === "ring") {
      // impact shockwave: a circle that expands as it fades
      ctx.strokeStyle = `rgba(21,23,28,${0.5 * k})`;
      ctx.lineWidth = 2.5 * k + 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8 + (1 - k) * 46, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(200,204,210,${0.7 * k})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5 + (1 - k) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Ink speed-streaks trailing a fast-moving body. */
function drawStreaks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  vy: number
) {
  const speed = Math.hypot(vx, vy);
  if (speed < 850) return;
  const nx = -vx / speed;
  const ny = -vy / speed;
  const px = -ny; // perpendicular, for fanning the lines out
  const py = nx;
  const len = Math.min(64, speed * 0.045);
  ctx.save();
  ctx.strokeStyle = `rgba(21,23,28,${Math.min(0.4, (speed - 850) / 2600)})`;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (const off of [-30, 0, 30]) {
    const sx = x + nx * 46 + px * off;
    const sy = y + ny * 46 + py * off;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + nx * len, sy + ny * len);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, b: { text: string; x: number; y: number }) {
  ctx.font = "700 15px system-ui, sans-serif";
  const w = ctx.measureText(b.text).width + 26;
  const h = 36;
  const x = Math.min(Math.max(b.x - w / 2, 8), VIEW_W - w - 8);
  const y = Math.max(b.y - h - 22, 8);
  rr(ctx, x, y, w, h, 11);
  inked(ctx, PAPER, 2.6);
  // tail
  ctx.beginPath();
  ctx.moveTo(b.x - 8, y + h - 2);
  ctx.lineTo(b.x + 10, y + h - 2);
  ctx.lineTo(b.x + 3, y + h + 13);
  ctx.closePath();
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(b.x - 8, y + h - 1);
  ctx.lineTo(b.x + 3, y + h + 13);
  ctx.lineTo(b.x + 10, y + h - 1);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.fillText(b.text, x + 13, y + 23);
}

/* ── main render ──────────────────────────────────────────────────── */

export function render(ctx: CanvasRenderingContext2D, s: RenderState) {
  ctx.save();
  if (s.shake > 0.2) {
    ctx.translate(Math.sin(s.t * 143) * s.shake, Math.cos(s.t * 97) * s.shake);
  }

  drawRoom(ctx);
  drawWindow(ctx, s.t);
  drawPoster(ctx, s.posterTilt);
  drawClock(ctx, s);
  drawWhiteboard(ctx, s);
  drawCabinet(ctx);
  drawPlant(ctx, s.t, s.plantWob);
  drawLight(ctx, s);
  drawChair(ctx);
  drawCable(ctx, s);
  drawDesk(ctx, s);
  drawProps(ctx, s);

  const p = s.guy.phase;
  if (p === "flying") drawStreaks(ctx, s.guy.x, s.guy.y, s.guy.vx, s.guy.vy);
  for (const pr of s.props)
    if (pr.state === "flying") drawStreaks(ctx, pr.x, pr.y, pr.vx, pr.vy);

  if (p === "working" || p === "typing" || p === "sent") drawSeated(ctx, s);
  else if (p === "sitting") drawSeated(ctx, s, s.transition);
  else if (p === "despair") drawDespair(ctx, s);
  else if (p === "grabbed") drawDangle(ctx, s);
  else if (p === "flying") drawFly(ctx, s);
  else if (p === "dazed") drawLie(ctx, s);
  else if (p === "rising") drawWalk(ctx, s, false, s.transition);
  else drawWalk(ctx, s, p === "storming");

  drawParticles(ctx, s.particles);
  if (s.bubble) drawBubble(ctx, s.bubble);

  ctx.restore();
}

/** Hit test for grabbing a prop. Padded, or it's hopeless on a phone. */
export function propHitBox(p: Prop): { x: number; y: number; w: number; h: number } {
  const r = PROP_R[p.kind] + 22;
  return { x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 };
}

/**
 * Hit test for grabbing him. The box is deliberately generous — on a phone
 * the whole scene is ~343px wide, and a tight box would be an unusable touch
 * target. Kev wins over prop hit boxes wherever they overlap.
 */
export function guyHitBox(guy: Guy): { x: number; y: number; w: number; h: number } {
  const pad = 24;
  const grow = (x: number, y: number, w: number, h: number) => ({
    x: x - pad,
    y: y - pad,
    w: w + pad * 2,
    h: h + pad * 2,
  });
  if (
    guy.phase === "working" ||
    guy.phase === "typing" ||
    guy.phase === "sent" ||
    guy.phase === "sitting" ||
    guy.phase === "despair"
  ) {
    return grow(SEAT_HEAD_X - 46, SEAT_HEAD_Y - 34, 96, 150);
  }
  // mid-rise he is still low and sprawled — keep the box floor-hugging
  if (guy.phase === "rising") {
    return grow(guy.x - 78, FLOOR_Y - 150, 156, 154);
  }
  if (guy.phase === "dazed") {
    return grow(guy.x - 96, FLOOR_Y - 84, 190, 88);
  }
  if (guy.phase === "flying" || guy.phase === "grabbed") {
    return grow(guy.x - 52, guy.y - 74, 104, 168);
  }
  return grow(guy.x - 50, guy.y - 222, 100, 226);
}
