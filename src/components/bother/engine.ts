/**
 * Bother Kev — constants, level geometry and physics for the office
 * mini-game. Rendering lives in draw.ts, the state machine + React glue
 * in BotherGame.tsx.
 */

export const VIEW_W = 960;
export const VIEW_H = 540;

export const FLOOR_Y = 470;
export const WALL_L = 26;
export const WALL_R = 934;
export const CEIL_Y = 46;

/**
 * Character scale. Poses are authored in "unit" coords (head radius 24) and
 * drawn through ctx.scale(K, K), so one number resizes the whole cast.
 */
export const K = 1.45;
/** Rough collision radius while tumbling, in world px. */
export const BODY_R = 42;

/**
 * The desk faces right: we see it side-on, Kev seated at its left end in
 * profile, reaching right to the keyboard with the monitor beyond it. That
 * orientation is what makes the typing readable.
 */
export const SEAT_X = 462;
export const CHAIR_SEAT_Y = FLOOR_Y - 66; // 404
export const SEAT_HEAD_X = 475;
export const SEAT_HEAD_Y = 302;

/**
 * A short desk: it stops well clear of the right wall, which also means a
 * ragdoll that lands on it always has room to fall off either end.
 */
export const DESK = { x: 498, w: 300, top: 380 } as const;
export const KEYBOARD = { x: 508, w: 104 } as const;
export const MONITOR = { x: 664, y: 250, w: 128, h: 116 } as const;

/** Speed cap on a flick, so a violent swipe can't fling him off-world. */
export const MAX_THROW = 2400;
/** How fast he trudges back to the chair. */
export const WALK_SPEED = 205;
export const STORM_SPEED = 300;
/** Walk accel/decel — he eases up to speed and slows into the chair. */
export const WALK_ACCEL = 9;

/** Beat lengths for the recovery chain: land → dazed → rising → walk → sitting. */
export const DAZE_TIME = 0.8;
export const RISE_TIME = 0.5;
export const SIT_TIME = 0.3;

/** Spring that carries him to the pointer, so a grab swings rather than snaps. */
export const GRAB_STIFF = 200;
export const GRAB_DAMP = 23;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** He snaps somewhere in this range — re-rolled after every meltdown. */
export const MIN_BOTHERS = 9;
export const MAX_BOTHERS = 17;

export const randThreshold = () =>
  MIN_BOTHERS + Math.floor(Math.random() * (MAX_BOTHERS - MIN_BOTHERS + 1));

/** 0 content · 1 annoyed · 2 angry · 3 meltdown */
export type Tier = 0 | 1 | 2 | 3;
export const tierFor = (bothers: number, threshold: number): Tier => {
  const f = bothers / threshold;
  if (f >= 1) return 3;
  if (f >= 0.7) return 2;
  if (f >= 0.4) return 1;
  return 0;
};

export type Phase =
  | "working" // typing at the desk (grabbable)
  | "grabbed" // dangling from the pointer
  | "flying" // ragdolling around the office
  | "dazed" // flat on the floor, seeing stars
  | "rising" // peeling himself off the floor onto his feet
  | "returning" // walking back to the chair
  | "storming" // threshold hit: marching back, ungrabbable
  | "sitting" // lowering into the chair
  | "typing" // furiously composing THE email
  | "sent" // slumped after sending; overlay is up
  | "despair"; // the cable was pulled mid-email — head down on the desk

export type Guy = {
  phase: Phase;
  phaseT: number; // seconds in current phase
  x: number;
  y: number; // feet (or body center while flying — see draw.ts)
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  facing: 1 | -1;
  walkPhase: number;
  /** Impact deformation: >0 flattened vertically, <0 flattened horizontally. */
  squash: number;
  /**
   * Set once he has been shoved off the desktop: the desk stops catching him
   * for the rest of this flight, so he slides off and reaches the floor
   * instead of re-landing on it forever.
   */
  deskPass: boolean;
};

export const makeGuy = (): Guy => ({
  phase: "working",
  phaseT: 0,
  x: SEAT_X,
  y: FLOOR_Y,
  vx: 0,
  vy: 0,
  rot: 0,
  vrot: 0,
  facing: 1,
  walkPhase: 0,
  squash: 0,
  deskPass: false,
});

export type BounceEvent = { x: number; y: number; strength: number; onDesk: boolean };

/**
 * One tick of ragdoll flight. Bounces off walls, ceiling, floor and the
 * desk top. Returns impact events (for sounds/particles/screen-shake) and
 * whether he has come to rest.
 */
export function stepFlight(g: Guy, dt: number): { impacts: BounceEvent[]; atRest: boolean } {
  const impacts: BounceEvent[] = [];
  const R = BODY_R;

  g.squash *= Math.exp(-9 * dt);
  g.vy = Math.min(g.vy + 3000 * dt, 2600);
  g.vx *= Math.exp(-0.5 * dt); // light air drag, so long ricochets still end
  g.x += g.vx * dt;
  g.y += g.vy * dt;
  g.rot += g.vrot * dt;
  g.vrot *= Math.exp(-0.9 * dt);

  /** axis "v" = he pancakes flat, "h" = he squeezes narrow. */
  const bounce = (strength: number, axis: "v" | "h", onDesk = false) => {
    const s = Math.min(0.34, strength / 3200);
    if (s > 0.05) g.squash = axis === "v" ? s : -s;
    if (strength > 220) impacts.push({ x: g.x, y: g.y, strength, onDesk });
  };

  if (g.x < WALL_L + R) {
    g.x = WALL_L + R;
    bounce(Math.abs(g.vx), "h");
    g.vx = Math.abs(g.vx) * 0.55;
    g.vrot = -g.vrot * 0.6;
  } else if (g.x > WALL_R - R) {
    g.x = WALL_R - R;
    bounce(Math.abs(g.vx), "h");
    g.vx = -Math.abs(g.vx) * 0.55;
    g.vrot = -g.vrot * 0.6;
  }

  if (g.y < CEIL_Y + R) {
    g.y = CEIL_Y + R;
    bounce(Math.abs(g.vy), "v");
    g.vy = Math.abs(g.vy) * 0.4;
  }

  // Desk top (only from above, only while falling).
  const overDesk = g.x > DESK.x - 6 && g.x < DESK.x + DESK.w + 6;
  const deskSurface = DESK.top - 6;
  if (!g.deskPass && g.vy > 0 && overDesk && g.y > deskSurface - R && g.y - g.vy * dt <= deskSurface - R + 40) {
    g.y = deskSurface - R;
    bounce(Math.abs(g.vy), "v", true);
    g.vy = -Math.abs(g.vy) * 0.45;
    g.vx *= 0.85;
  }

  // Floor. Damped harder than the walls so he settles promptly — waiting on a
  // long bounce-down reads as dead time, not physics.
  const floorSurface = FLOOR_Y - R + 8;
  if (g.y > floorSurface) {
    g.y = floorSurface;
    bounce(Math.abs(g.vy), "v");
    g.vy = -Math.abs(g.vy) * 0.42;
    if (Math.abs(g.vy) < 190) g.vy = 0;
  }

  const grounded = g.y >= floorSurface - 0.5 && g.vy === 0;
  if (grounded) g.vx *= Math.exp(-6.5 * dt);

  const atRest = grounded && Math.abs(g.vx) < 40;
  return { impacts, atRest };
}

/** Where he lies down after flight (feet coord for the "dazed" pose). */
export function settleOnFloor(g: Guy) {
  g.y = FLOOR_Y;
  g.vx = 0;
  g.vy = 0;
  g.vrot = 0;
  g.rot = 0;
  g.deskPass = false;
}

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  kind: "puff" | "paper" | "star" | "steam" | "shard" | "ring";
  spin: number;
};

export function burst(
  parts: Particle[],
  x: number,
  y: number,
  kind: Particle["kind"],
  n: number
) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = kind === "paper" ? 120 + Math.random() * 260 : 60 + Math.random() * 180;
    parts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (kind === "paper" ? 160 : 60),
      life: 0,
      maxLife: kind === "paper" ? 1.4 : kind === "steam" ? 0.9 : 0.55,
      kind,
      spin: (Math.random() - 0.5) * 10,
    });
  }
}

export function stepParticles(parts: Particle[], dt: number) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life += dt;
    if (p.life > p.maxLife) {
      parts.splice(i, 1);
      continue;
    }
    const g =
      p.kind === "paper" ? 900 : p.kind === "steam" ? -220 : p.kind === "shard" ? 1600 : p.kind === "ring" ? 0 : 300;
    p.vy += g * dt;
    p.vx *= Math.exp(-1.6 * dt);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // shards skitter to a stop on the floor instead of sailing through it
    if (p.kind === "shard" && p.y > FLOOR_Y - 3) {
      p.y = FLOOR_Y - 3;
      p.vy = -Math.abs(p.vy) * 0.3;
      p.vx *= 0.6;
    }
  }
}

/* ── desk props: the mug and the stapler ───────────────────────────── */

export type PropKind = "mug" | "stapler";

export type PropState =
  | "desk" // sitting at its home spot on the desk
  | "held" // dangling from the pointer
  | "flying" // airborne
  | "resting" // came to rest somewhere that isn't its home
  | "broken"; // mug only — gone until Kev tidies up

export type Prop = {
  kind: PropKind;
  state: PropState;
  x: number;
  y: number; // center
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  /**
   * Game-time until which this prop can't bonk Kev again. The ricochet can
   * leave it inside his hit box for a few frames, and one throw must not
   * count as three bothers.
   */
  bonkCdUntil: number;
};

/** Home spots, sized so both clear the keyboard, monitor stand and Kev. */
export const PROP_HOME: Record<PropKind, { x: number; y: number }> = {
  mug: { x: 636, y: DESK.top - 14 },
  stapler: { x: 666, y: DESK.top - 7 },
};

/**
 * Rough collision radius per prop. The stapler is wider than this, but the
 * radius has to match its *height* or it rests floating above the desk.
 */
export const PROP_R: Record<PropKind, number> = { mug: 13, stapler: 9 };

/** Impact speed at which the mug gives up being a mug. */
export const MUG_BREAK_SPEED = 780;

export const makeProps = (): Prop[] =>
  (["mug", "stapler"] as const).map((kind) => ({
    kind,
    state: "desk",
    x: PROP_HOME[kind].x,
    y: PROP_HOME[kind].y,
    vx: 0,
    vy: 0,
    rot: 0,
    vrot: 0,
    bonkCdUntil: 0,
  }));

export function resetProp(p: Prop) {
  p.state = "desk";
  p.x = PROP_HOME[p.kind].x;
  p.y = PROP_HOME[p.kind].y;
  p.vx = 0;
  p.vy = 0;
  p.rot = 0;
  p.vrot = 0;
}

export type PropImpact = { x: number; y: number; strength: number; broke: boolean };

/**
 * One tick of flight for a thrown (or knocked-loose) prop. Same room as Kev:
 * walls, ceiling, floor and the desk top, but props are allowed to rest on
 * the desk. Returns impacts; `broke` means the mug just shattered.
 */
export function stepProp(p: Prop, dt: number): PropImpact[] {
  if (p.state !== "flying") return [];
  const impacts: PropImpact[] = [];
  const R = PROP_R[p.kind];
  const bounciness = p.kind === "mug" ? 0.45 : 0.3; // staplers land like bricks

  p.vy = Math.min(p.vy + 3000 * dt, 2600);
  p.vx *= Math.exp(-0.4 * dt);
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.rot += p.vrot * dt;
  p.vrot *= Math.exp(-0.7 * dt);

  const hit = (strength: number) => {
    const broke = p.kind === "mug" && strength > MUG_BREAK_SPEED;
    if (broke) p.state = "broken";
    if (strength > 160 || broke) impacts.push({ x: p.x, y: p.y, strength, broke });
    return broke;
  };

  if (p.x < WALL_L + R) {
    p.x = WALL_L + R;
    if (hit(Math.abs(p.vx))) return impacts;
    p.vx = Math.abs(p.vx) * bounciness;
    p.vrot = -p.vrot * 0.5;
  } else if (p.x > WALL_R - R) {
    p.x = WALL_R - R;
    if (hit(Math.abs(p.vx))) return impacts;
    p.vx = -Math.abs(p.vx) * bounciness;
    p.vrot = -p.vrot * 0.5;
  }

  if (p.y < CEIL_Y + R) {
    p.y = CEIL_Y + R;
    if (hit(Math.abs(p.vy))) return impacts;
    p.vy = Math.abs(p.vy) * bounciness;
  }

  // desk top, from above while falling
  const overDesk = p.x > DESK.x - 4 && p.x < DESK.x + DESK.w + 4;
  const deskSurface = DESK.top - 2;
  if (p.vy > 0 && overDesk && p.y > deskSurface - R && p.y - p.vy * dt <= deskSurface - R + 30) {
    p.y = deskSurface - R;
    if (hit(Math.abs(p.vy))) return impacts;
    p.vy = -Math.abs(p.vy) * bounciness;
    p.vx *= 0.7;
    if (Math.abs(p.vy) < 130) p.vy = 0;
  }

  const floorSurface = FLOOR_Y - R + 4;
  if (p.y > floorSurface) {
    p.y = floorSurface;
    if (hit(Math.abs(p.vy))) return impacts;
    p.vy = -Math.abs(p.vy) * bounciness;
    p.vx *= 0.6;
    if (Math.abs(p.vy) < 130) p.vy = 0;
  }

  // settled?
  const onDeskNow = overDesk && Math.abs(p.y - (deskSurface - R)) < 1 && p.vy === 0;
  const onFloorNow = Math.abs(p.y - floorSurface) < 1 && p.vy === 0;
  if ((onDeskNow || onFloorNow) && Math.abs(p.vx) < 24) {
    p.vx = 0;
    p.vrot = 0;
    // settle flat-ish so a mug doesn't rest on its handle
    p.rot = Math.round(p.rot / (Math.PI / 2)) * (Math.PI / 2);
    const home = PROP_HOME[p.kind];
    const atHome = onDeskNow && Math.abs(p.x - home.x) < 26;
    if (atHome) resetProp(p);
    else p.state = "resting";
  }
  return impacts;
}

/** Does this prop currently overlap Kev's hit box? */
export function propTouchesBox(
  p: Prop,
  box: { x: number; y: number; w: number; h: number }
): boolean {
  const R = PROP_R[p.kind];
  const cx = Math.max(box.x, Math.min(p.x, box.x + box.w));
  const cy = Math.max(box.y, Math.min(p.y, box.y + box.h));
  return (p.x - cx) ** 2 + (p.y - cy) ** 2 < R * R;
}

/** Mutterings, by anger tier. Picked at random when he sits back down. */
export const MUTTERS: Record<Tier, string[]> = {
  0: ["ok… where was I.", "spreadsheet time.", "the mug survived. good."],
  1: ["again? really?", "I was IN the zone.", "very mature."],
  2: ["one. more. time.", "do you think I'm not a person?", "I keep a tally, you know."],
  3: ["THAT'S IT."],
};

export const DAZED_LINES = ["ow.", "why.", "my stapler…", "cool. cool cool cool."];
export const PEACE_LINE = "oh… you're just watching me work? that's… nice, actually.";
export const WORK_LINES = ["so many rows…", "row 4,102 of 9,880.", "hm. off by one.", "almost caught up…"];

/** Held aloft too long. Indexed by escalation step, said once each per grab. */
export const HOLD_LINES = ["put me down.", "I have a meeting at 3.", "this is my life now."];

/** A prop was flung but missed him. Gentle protest, on a cooldown. */
export const PROP_MISS_LINES = [
  "please don't throw my stuff.",
  "that's office property.",
  "I had that arranged.",
];

/** A prop actually hit him. Counts as a bother — he is not calm about it. */
export const PROP_HIT_LINES: Record<PropKind, string[]> = {
  mug: ["you threw a MUG at me?", "that had coffee in it!", "the MUG? seriously?"],
  stapler: ["THE STAPLER? REALLY?", "that one has staples IN it.", "ow. of course. the stapler."],
};

/** The mug did not survive. This one hurts him personally. */
export const MUG_BREAK_LINES = ["…that was my favorite mug.", "the mug. you broke the mug.", "no. not the mug."];

/** Bonked while already composing the email — nothing left to escalate. */
export const TOO_LATE_LINE = "not. now.";

/* ── the work (his rows are real, and they persist) ────────────────── */

/** Base seconds per row; flow-state multipliers when left alone. */
export const ROW_SECS = 1.6;
export const FLOW_1_AFTER = 25; // uninterrupted seconds → 2× rate
export const FLOW_2_AFTER = 60; // → 3× rate

/** Rows lost when a throw finally lands him back at the desk. */
export const rowLoss = (worstImpact: number) =>
  15 + Math.floor(Math.random() * 8) + Math.min(30, Math.floor(worstImpact / 120));
export const ROW_LOSS_BONK = 8;

export const SHEET_DONE_LINE = "…done. that's the whole sheet.";
/** Next sheet name, by count already finished. */
export const sheetName = (n: number) => `Q${(n % 4) + 1}.`;

/* ── memory beats ──────────────────────────────────────────────────── */

/** Said once, ever, the first time he ducks away from your cursor. */
export const FLINCH_LINE = "sorry. reflex.";

/** He quotes your own answer back, eventually. Keyed by WhyAnswer. */
export const WHY_CALLBACKS: Record<string, string[]> = {
  funny: ["'it was funny.' …was it?", "still funny?"],
  curious: ["'to see what would happen.' now you know.", "curiosity, huh."],
  dunno: ["'I don't know.' yeah. me neither.", "still don't know?"],
  silent: ["you never did say why.", "…nothing to say. still."],
};

/* ── the cable (the choice) ────────────────────────────────────────── */

/** Where the wall jack lives; the cable runs there from the desk. */
export const CABLE_JACK = { x: 866, y: FLOOR_Y - 26 } as const;
/** Generous click target around the jack while the window is live. */
export const CABLE_HIT = { x: CABLE_JACK.x - 34, y: CABLE_JACK.y - 30, w: 68, h: 60 } as const;
/** The pull window opens this far into the compose (0..1). */
export const CABLE_ARM_AT = 0.35;

export const DESPAIR_TIME = 5;
export const DESPAIR_LINE = "I lost everything.";
/** After a pull he is brittle: the next threshold rolls from this range. */
export const MIN_BOTHERS_BRITTLE = 6;
export const MAX_BOTHERS_BRITTLE = 12;
export const randThresholdBrittle = () =>
  MIN_BOTHERS_BRITTLE + Math.floor(Math.random() * (MAX_BOTHERS_BRITTLE - MIN_BOTHERS_BRITTLE + 1));
/** And he types at half speed for a while. */
export const BRITTLE_WORK_SECS = 60;
