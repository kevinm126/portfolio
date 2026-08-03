"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleHelp, Volume2, VolumeX } from "lucide-react";
import {
  BODY_R,
  BRITTLE_WORK_SECS,
  CABLE_ARM_AT,
  CABLE_HIT,
  DAZED_LINES,
  DAZE_TIME,
  DESK,
  DESPAIR_LINE,
  DESPAIR_TIME,
  FLINCH_LINE,
  FLOOR_Y,
  FLOW_1_AFTER,
  FLOW_2_AFTER,
  GRAB_DAMP,
  GRAB_STIFF,
  HOLD_LINES,
  MAX_THROW,
  MUG_BREAK_LINES,
  MUTTERS,
  PEACE_LINE,
  PROP_HIT_LINES,
  PROP_MISS_LINES,
  RISE_TIME,
  ROW_LOSS_BONK,
  ROW_SECS,
  SEAT_X,
  SEAT_HEAD_X,
  SEAT_HEAD_Y,
  SHEET_DONE_LINE,
  SIT_TIME,
  STORM_SPEED,
  TOO_LATE_LINE,
  VIEW_H,
  VIEW_W,
  WALL_R,
  WALK_ACCEL,
  WALK_SPEED,
  WHY_CALLBACKS,
  WORK_LINES,
  burst,
  clamp01,
  easeInOutQuad,
  easeOutCubic,
  makeGuy,
  makeProps,
  propTouchesBox,
  randThreshold,
  randThresholdBrittle,
  resetProp,
  rowLoss,
  sheetName,
  stepFlight,
  stepParticles,
  stepProp,
  settleOnFloor,
  tierFor,
  type Guy,
  type Particle,
  type Prop,
  type Tier,
} from "./engine";
import { guyHitBox, propHitBox, render, type FaceMood, type RenderState } from "./draw";
import {
  FLINCH_TRUST,
  FLINCH_TRUST_BAD,
  ROWS_TARGET,
  TRUST,
  clampTrust,
  greetingFor,
  loadMemory,
  saveMemory,
  wipeMemory,
  type KevMemory,
  type WhyAnswer,
} from "./memory";

type Overlay =
  | { kind: "sent"; line: string; subject: string; demo: boolean }
  | { kind: "limit" }
  | { kind: "failed" }
  | { kind: "apologized"; demo: boolean }
  | { kind: "why" }
  | { kind: "cablePulled"; lost: number };

type Game = {
  guy: Guy;
  t: number;
  bothers: number; // current cycle (resets after a meltdown)
  incidents: number; // lifetime session tally (whiteboard)
  threshold: number;
  startedAt: number; // ms, first "I understand"
  lastBotherAt: number;
  particles: Particle[];
  props: Prop[];
  /** Index into props while one is being dragged; Kev uses guy.phase. */
  heldProp: number | null;
  bubble: { text: string; until: number } | null;
  faceOverride: FaceMood | null;
  faceOverrideUntil: number;
  lightSwing: number;
  lightSwingV: number;
  lightFlickerUntil: number;
  posterTilt: number;
  posterTiltV: number;
  /** Crookedness the poster keeps after each knock, until the next reset. */
  posterSkew: number;
  plantWob: number;
  shake: number;
  screenMode: "work" | "compose" | "sent" | "off";
  composeT: number;
  grabTilt: number;
  walkTarget: number | null;
  /** Set when the walk back is a meltdown march, read when he lands in the chair. */
  stormPending: boolean;
  peaceShown: boolean;
  nextWorkLineAt: number;
  nextClackAt: number;
  /** How many of the held-too-long lines he has said this grab. */
  holdLinesSaid: number;
  /** When, if ever, seated Kev gives up waiting and replaces his stuff. */
  tidyDeadline: number | null;
  /** Wall-clock ms of the last "don't throw my stuff" protest. */
  lastPropLineAt: number;
  pointer: { x: number; y: number; history: { x: number; y: number; t: number }[] };
  grabTravel: number;
  sendInFlight: boolean;

  /* ── memory / trust ── */
  mem: KevMemory;
  /** Fractional spreadsheet rows; mem.rows mirrors the floor of this. */
  rows: number;
  /** Uninterrupted working seconds — flow state speeds him up. */
  rowFlow: number;
  /** Rows lost mid-air, revealed (with the line) when he re-sits. */
  pendingRowLoss: number;
  /** Strongest impact of the current flight, for scaling the loss. */
  worstImpact: number;
  /** Typing at half speed until this game-time (post-cable brittleness). */
  workSlowUntil: number;
  greetingPending: boolean;
  flinchT: number;
  flinchCdUntil: number;
  /** Fourth-wall stare until this game-time; 0 = not staring. */
  stareUntil: number;
  meltdownsThisSession: number;
  stareOwed: boolean;
  /** True from meltdown until the "why" question has been shown. */
  whyPending: boolean;
  cablePulled: boolean;
  cableOverlayAt: number | null;
  cableRowsLost: number;
  /** Crowd confession beat on the whiteboard. */
  confessionText: string | null;
  confessionUntil: number;
  nextConfessionAt: number;
  whyCounts: Record<WhyAnswer, number> | null;
  /** Seconds of peace accumulated toward the next trust tick. */
  peaceAccum: number;
  lastSavedAt: number;
};

const GRAB_STATES: Guy["phase"][] = [
  "working",
  "dazed",
  "rising",
  "returning",
  "sitting",
  "flying",
];

/** Wall-clock helpers, hoisted so event handlers stay lint-pure. */
const nowSecs = () => performance.now() / 1000;
const wallNow = () => Date.now();

export default function BotherGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const G = useRef<Game | null>(null);

  const [intro, setIntro] = useState(true);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [ui, setUi] = useState({ bothers: 0, tier: 0 as Tier });
  const [muted, setMuted] = useState(false);
  const [apology, setApology] = useState<"idle" | "sending">("idle");
  const [wipeArmed, setWipeArmed] = useState(false);

  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  const blockedRef = useRef(true); // pointer input blocked while an overlay is up
  useEffect(() => {
    blockedRef.current = intro || overlay !== null;
  }, [intro, overlay]);
  const overlayRef = useRef(setOverlay);
  const uiRef = useRef(setUi);

  /* ── sound ──────────────────────────────────────────────── */
  const audioRef = useRef<AudioContext | null>(null);
  function beep(f0: number, f1: number, dur: number, type: OscillatorType, gain: number) {
    if (mutedRef.current) return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = (audioRef.current ??= new Ctor());
      if (ctx.state === "suspended") void ctx.resume();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(Math.max(f0, 1), ctx.currentTime);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), ctx.currentTime + dur);
      g.gain.setValueAtTime(gain, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch {
      /* audio is decorative */
    }
  }
  const beepRef = useRef(beep);
  useEffect(() => {
    beepRef.current = beep;
  });

  /* ── game loop ──────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g: Game = {
      guy: makeGuy(),
      t: 0,
      bothers: 0,
      incidents: 0,
      threshold: randThreshold(),
      startedAt: Date.now(),
      lastBotherAt: Date.now(),
      particles: [],
      props: makeProps(),
      heldProp: null,
      bubble: null,
      faceOverride: null,
      faceOverrideUntil: 0,
      lightSwing: 0,
      lightSwingV: 0,
      lightFlickerUntil: 0,
      posterTilt: 0,
      posterTiltV: 0,
      posterSkew: 0,
      plantWob: 0,
      shake: 0,
      screenMode: "work",
      composeT: 0,
      grabTilt: 0,
      walkTarget: null,
      stormPending: false,
      peaceShown: false,
      nextWorkLineAt: 8,
      nextClackAt: 0,
      holdLinesSaid: 0,
      tidyDeadline: null,
      lastPropLineAt: 0,
      pointer: { x: 0, y: 0, history: [] },
      grabTravel: 0,
      sendInFlight: false,
      mem: loadMemory(),
      rows: 0,
      rowFlow: 0,
      pendingRowLoss: 0,
      worstImpact: 0,
      workSlowUntil: 0,
      greetingPending: true,
      flinchT: 0,
      flinchCdUntil: 0,
      stareUntil: 0,
      meltdownsThisSession: 0,
      stareOwed: false,
      whyPending: false,
      cablePulled: false,
      cableOverlayAt: null,
      cableRowsLost: 0,
      confessionText: null,
      confessionUntil: 0,
      nextConfessionAt: 90,
      whyCounts: null,
      peaceAccum: 0,
      lastSavedAt: 0,
    };
    g.mem.visits += 1;
    g.mem.lastVisitAt = Date.now();
    g.rows = g.mem.rows;
    saveMemory(g.mem);
    G.current = g;

    // today's crowd confession counts, for the whiteboard beat
    fetch("/api/bother")
      .then((r) => r.json())
      .then((d: { ok: boolean; counts?: Record<WhyAnswer, number> }) => {
        if (d.ok && d.counts && G.current) G.current.whyCounts = d.counts;
      })
      .catch(() => {});

    const now0 = new Date();
    const clockH = now0.getHours();
    const clockM = now0.getMinutes();

    let scale = 1;
    let dpr = 1;
    const resize = () => {
      const w = wrap.clientWidth;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round((w * VIEW_H * dpr) / VIEW_W);
      scale = (w / VIEW_W) * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const say = (text: string, secs = 2.6) => {
      g.bubble = { text, until: g.t + secs };
    };
    const pick = (arr: readonly string[]) => arr[Math.floor(Math.random() * arr.length)];
    const tier = () => tierFor(g.bothers, g.threshold);
    const pushUi = () => uiRef.current({ bothers: g.bothers, tier: tier() });

    const persist = () => {
      g.mem.rows = Math.floor(g.rows);
      saveMemory(g.mem);
      g.lastSavedAt = g.t;
    };
    const applyTrust = (delta: number) => {
      g.mem.trust = clampTrust(g.mem.trust + delta);
    };
    /** One grab-release or prop hit: the shared bookkeeping. */
    const countIncident = () => {
      g.bothers += 1;
      g.incidents += 1;
      g.mem.lifetimeIncidents += 1;
      applyTrust(TRUST.incident);
      g.lastBotherAt = Date.now();
      g.peaceAccum = 0;
      g.rowFlow = 0;
    };
    /** The moment the hurtful email starts being typed. */
    const meltdownBegan = () => {
      g.mem.meltdowns += 1;
      g.meltdownsThisSession += 1;
      if (g.meltdownsThisSession >= 2) g.stareOwed = true;
      g.whyPending = true;
      applyTrust(TRUST.meltdown);
      persist();
    };

    /** Ripple an impact through the room: poster, light, plant, printer. */
    const rattle = (x: number, y: number, strength: number) => {
      if (strength < 500) return;
      const posterX = 348;
      if (Math.abs(x - posterX) < 240) {
        g.posterTiltV += (Math.random() - 0.35) * Math.min(4, strength / 500);
        if (strength > 1100) g.posterSkew = Math.max(-0.1, Math.min(0.1, g.posterSkew + (Math.random() - 0.4) * 0.05));
      }
      if (y < 130 && Math.abs(x - 330) < 260) g.lightFlickerUntil = g.t + 0.5 + strength / 4000;
      if (x > 700 && y > FLOOR_Y - 160) g.plantWob = Math.min(1, g.plantWob + strength / 2400);
      // a hard hit near the printer coughs a few sheets out of the tray
      if (strength > 900 && Math.abs(x - 320) < 140 && y > FLOOR_Y - 240) {
        burst(g.particles, 320, FLOOR_Y - 92, "paper", Math.min(6, Math.round(strength / 500)));
        beepRef.current(700, 400, 0.05, "square", 0.02);
      }
    };

    /**
     * A hard landing on the desk sends whatever's sitting on it hopping.
     * Loose props get knocked into flight and take their chances.
     */
    const jostleDeskProps = (strength: number, fromX: number) => {
      for (const p of g.props) {
        if (p.state !== "desk" && p.state !== "resting") continue;
        const onDesk = p.y < DESK.top + 4;
        if (!onDesk) continue;
        const kick = Math.min(1, strength / 2600);
        if (kick < 0.14) continue;
        p.state = "flying";
        p.vy = -kick * (340 + Math.random() * 160);
        p.vx = Math.sign(p.x - fromX || Math.random() - 0.5) * kick * (90 + Math.random() * 130);
        p.vrot = (Math.random() - 0.5) * 8 * kick;
      }
    };

    /**
     * A bother caused by a prop (bonk, broken mug) rather than a grab. If it
     * tips him over the threshold while he's at the desk, he skips the march
     * and goes straight for the keyboard.
     */
    const propBother = () => {
      countIncident();
      pushUi();
      if (g.bothers >= g.threshold) {
        if (g.guy.phase === "working" || g.guy.phase === "sitting") {
          say("THAT'S IT.", 1.6);
          beepRef.current(220, 80, 0.4, "sawtooth", 0.08);
          g.guy.phase = "typing";
          g.guy.phaseT = 0;
          g.screenMode = "compose";
          g.composeT = 0;
          meltdownBegan();
        } else if (g.guy.phase === "returning") {
          say("THAT'S IT.", 1.6);
          beepRef.current(220, 80, 0.4, "sawtooth", 0.08);
          g.guy.phase = "storming";
        }
        // any other phase: the storm check in startReturn catches it
      }
    };

    const startReturn = () => {
      const storm = g.bothers >= g.threshold;
      g.guy.phase = storm ? "storming" : "returning";
      g.guy.phaseT = 0;
      g.guy.y = FLOOR_Y;
      g.walkTarget = SEAT_X;
      if (storm) {
        say("THAT'S IT.", 1.6);
        beepRef.current(220, 80, 0.4, "sawtooth", 0.08);
      }
    };

    const sendTheEmail = async () => {
      if (g.sendInFlight) return;
      g.sendInFlight = true;
      try {
        const res = await fetch("/api/bother", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "hurt",
            bothers: g.bothers,
            seconds: Math.round((Date.now() - g.startedAt) / 1000),
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          line?: string;
          subject?: string;
          demo?: boolean;
          reason?: string;
        };
        if (data.ok && data.line) {
          overlayRef.current({
            kind: "sent",
            line: data.line,
            subject: data.subject ?? "I need to say something",
            demo: !!data.demo,
          });
        } else if (data.reason === "limit") {
          overlayRef.current({ kind: "limit" });
        } else {
          overlayRef.current({ kind: "failed" });
        }
      } catch {
        overlayRef.current({ kind: "failed" });
      } finally {
        g.sendInFlight = false;
      }
    };

    let raf = 0;
    let last = performance.now();

    const advance = (dt: number) => {
      g.t += dt;
      const guy = g.guy;
      guy.phaseT += dt;

      // ambient: swinging light spring, shake decay, bubbles expiring
      g.lightSwingV += (-g.lightSwing * 26 - g.lightSwingV * 2.4) * dt;
      g.lightSwing += g.lightSwingV * dt;
      // the poster swings on its pin toward its (possibly crooked) rest angle
      g.posterTiltV += ((g.posterSkew - g.posterTilt) * 30 - g.posterTiltV * 3.2) * dt;
      g.posterTilt += g.posterTiltV * dt;
      g.plantWob *= Math.exp(-2.2 * dt);
      g.shake *= Math.exp(-5.5 * dt);
      if (g.bubble && g.t > g.bubble.until) g.bubble = null;
      if (g.faceOverride && g.t > g.faceOverrideUntil) g.faceOverride = null;
      stepParticles(g.particles, dt);

      // props: the held one chases the pointer, loose ones fly and land
      for (let i = 0; i < g.props.length; i++) {
        const p = g.props[i];
        if (g.heldProp === i) {
          p.vx += ((g.pointer.x - p.x) * 320 - p.vx * 26) * dt;
          p.vy += ((g.pointer.y - p.y) * 320 - p.vy * 26) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot = Math.max(-0.5, Math.min(0.5, p.vx * 0.0009));
          continue;
        }
        const wasFlying = p.state === "flying";
        for (const im of stepProp(p, dt)) {
          rattle(im.x, im.y, im.strength);
          if (im.broke) {
            burst(g.particles, im.x, im.y, "shard", 9);
            burst(g.particles, im.x, im.y, "steam", 3);
            g.shake = Math.max(g.shake, 4);
            // three quick dry cracks, close enough to a smash
            beepRef.current(2400, 300, 0.05, "square", 0.05);
            beepRef.current(1700, 200, 0.07, "square", 0.04);
            beepRef.current(900, 140, 0.1, "triangle", 0.04);
            if (g.guy.phase !== "typing" && g.guy.phase !== "sent" && g.guy.phase !== "storming") {
              say(pick(MUG_BREAK_LINES), 2.6);
              g.faceOverride = "worried";
              g.faceOverrideUntil = g.t + 2.6;
            }
            g.mem.mugsBroken += 1;
            applyTrust(TRUST.mugBreak - TRUST.incident); // net -5 with the incident below
            propBother();
          } else {
            burst(g.particles, im.x, im.y, "puff", Math.min(5, Math.round(im.strength / 400) + 1));
            if (p.kind === "mug") beepRef.current(1350, 900, 0.07, "sine", Math.min(0.05, im.strength / 16000));
            else beepRef.current(150, 90, 0.09, "triangle", Math.min(0.07, im.strength / 12000));
          }
        }
        // A prop in flight that clips Kev is very much a bother. The grab
        // hit box is padded way out for touch targets — shrink it back to
        // his actual silhouette, or a mug sailing over his head "hits" him.
        if (wasFlying && p.state === "flying" && Math.hypot(p.vx, p.vy) > 260 && g.t > p.bonkCdUntil) {
          const box = guyHitBox(guy);
          const snug = { x: box.x + 28, y: box.y + 28, w: box.w - 56, h: box.h - 56 };
          if (propTouchesBox(p, snug) && guy.phase !== "flying" && guy.phase !== "grabbed") {
            p.bonkCdUntil = g.t + 0.6;
            burst(g.particles, p.x, p.y, "star", 4);
            burst(g.particles, p.x, p.y, "ring", 1);
            g.shake = Math.max(g.shake, 5);
            guy.squash = 0.22;
            beepRef.current(260, 110, 0.12, "square", 0.06);
            // it ricochets off him and loses most of its heart
            p.vx = -p.vx * 0.35 + (Math.random() - 0.5) * 80;
            p.vy = Math.min(p.vy, 0) * 0.3 - 120;
            if (
              guy.phase === "typing" ||
              guy.phase === "sent" ||
              guy.phase === "storming" ||
              guy.phase === "despair"
            ) {
              say(TOO_LATE_LINE, 1.4);
            } else {
              say(pick(PROP_HIT_LINES[p.kind]), 2.4);
              g.faceOverride = null; // the tier face (angrier now) reads better
              if (guy.phase === "working") g.rows = Math.max(0, g.rows - ROW_LOSS_BONK);
              propBother();
            }
          }
        }
      }

      switch (guy.phase) {
        case "working": {
          const staring = g.stareUntil > g.t;

          // first settled moment of the visit: he acknowledges your history
          if (g.greetingPending && !blockedRef.current) {
            g.greetingPending = false;
            const greet = greetingFor(g.mem);
            if (greet.line) {
              say(greet.line, 3);
              if (greet.mood) {
                g.faceOverride = greet.mood;
                g.faceOverrideUntil = g.t + 3;
              }
            } else if (g.mem.visits > 1 && g.mem.trust < -60) {
              // beyond words — he just watches you arrive
              g.stareUntil = g.t + 2.5;
            }
          }

          // mercy: anger cools off if you leave him alone
          if (g.bothers > 0 && Date.now() - g.lastBotherAt > 40_000) {
            g.bothers -= 1;
            g.lastBotherAt = Date.now();
            pushUi();
          }
          // peace beat
          if (!g.peaceShown && g.incidents === 0 && g.mem.lifetimeIncidents === 0 && g.t > 50) {
            g.peaceShown = true;
            say(PEACE_LINE, 4.5);
            g.faceOverride = "happy";
            g.faceOverrideUntil = g.t + 4.5;
          }

          // the rows: his life's work, one cell at a time. Flow when left alone.
          if (!staring) {
            g.rowFlow += dt;
            const flow = g.rowFlow > FLOW_2_AFTER ? 3 : g.rowFlow > FLOW_1_AFTER ? 2 : 1;
            const brittle = g.t < g.workSlowUntil ? 0.5 : 1;
            g.rows += (dt / ROW_SECS) * flow * brittle;
            if (g.rows >= ROWS_TARGET) {
              g.rows = 0;
              g.rowFlow = 0;
              g.mem.sheetsDone += 1;
              say(SHEET_DONE_LINE, 3.6);
              g.faceOverride = "happy";
              g.faceOverrideUntil = g.t + 3.6;
              burst(g.particles, SEAT_HEAD_X + 120, DESK.top - 40, "paper", 6);
              g.nextWorkLineAt = g.t + 5; // "Q3." lands right after
              persist();
            }
          }

          // a quiet minute at a time, he starts to relax about you
          g.peaceAccum += dt;
          if (g.peaceAccum >= 60) {
            g.peaceAccum -= 60;
            applyTrust(TRUST.peacefulMinute);
          }

          // flinch: your cursor coming at him fast, and what it has learned to mean
          if (!staring && g.t > g.flinchCdUntil && g.mem.trust < FLINCH_TRUST) {
            const h = g.pointer.history;
            if (h.length >= 2) {
              const a = h[h.length - 2];
              const b = h[h.length - 1];
              const fresh = performance.now() / 1000 - b.t < 0.12;
              const hdt = Math.max(0.008, b.t - a.t);
              const vx = (b.x - a.x) / hdt;
              const vy = (b.y - a.y) / hdt;
              const speed = Math.hypot(vx, vy);
              const dx = SEAT_HEAD_X - b.x;
              const dy = SEAT_HEAD_Y - b.y;
              const dist = Math.hypot(dx, dy);
              const toward = vx * dx + vy * dy > 0;
              const speedGate = g.mem.trust < FLINCH_TRUST_BAD ? 150 : 500;
              if (fresh && toward && dist < 260 && speed > speedGate) {
                g.flinchT = 0.4;
                g.flinchCdUntil = g.t + 3;
                if (!g.mem.flinchSaid) {
                  g.mem.flinchSaid = true;
                  say(FLINCH_LINE, 2.2);
                  persist();
                }
              }
            }
          }

          // the whiteboard sometimes shows what everyone else confessed
          if (
            !staring &&
            g.t > g.nextConfessionAt &&
            g.mem.meltdowns > 0 &&
            g.whyCounts &&
            g.confessionUntil < g.t
          ) {
            const best = (Object.entries(g.whyCounts) as [WhyAnswer, number][])
              .filter(([, n]) => n > 0)
              .sort((x, y) => y[1] - x[1])[0];
            if (best) {
              const [answer, n] = best;
              const phrase =
                answer === "funny"
                  ? `${n} said "it was funny."`
                  : answer === "curious"
                    ? `${n} just wanted to see.`
                    : answer === "dunno"
                      ? `${n} said "I don't know."`
                      : `${n} said nothing at all.`;
              g.confessionText = `today, ${phrase}`;
              g.confessionUntil = g.t + 6;
            }
            g.nextConfessionAt = g.t + 120 + Math.random() * 60;
          }

          if (!staring && g.t > g.nextWorkLineAt && !g.bubble) {
            if (g.mem.lastWhy && Math.random() < 0.2) {
              say(pick(WHY_CALLBACKS[g.mem.lastWhy]), 2.6);
            } else if (Math.random() < 0.5) {
              const justFinished = g.rows < 40 && g.mem.sheetsDone > 0;
              say(justFinished ? sheetName(g.mem.sheetsDone) : pick(WORK_LINES), 2.2);
            }
            g.nextWorkLineAt = g.t + 11 + Math.random() * 9;
          }
          // his stuff stays wherever it landed for a while, but if you leave
          // him working he eventually replaces it without leaving the chair
          {
            const loose = g.props.some((p) => p.state === "resting" || p.state === "broken");
            if (!loose) g.tidyDeadline = null;
            else if (g.tidyDeadline === null) g.tidyDeadline = g.t + 22;
            else if (g.t > g.tidyDeadline) {
              g.tidyDeadline = null;
              for (const p of g.props) {
                if (p.state !== "resting" && p.state !== "broken") continue;
                const broke = p.state === "broken";
                burst(g.particles, p.x, p.y, "puff", 2);
                resetProp(p);
                burst(g.particles, p.x, p.y, broke ? "steam" : "puff", 2);
              }
              if (!g.bubble) say("…I keep spares.", 2.2);
            }
          }
          break;
        }
        case "grabbed": {
          // Damped spring toward the pointer rather than a hard snap: he lags,
          // swings, and overshoots a little, and the spring velocity is exactly
          // what the throw inherits — so grab → fling is one continuous motion.
          const p = g.pointer;
          const before = { x: guy.x, y: guy.y };
          guy.vx += ((p.x - guy.x) * GRAB_STIFF - guy.vx * GRAB_DAMP) * dt;
          guy.vy += ((p.y - guy.y) * GRAB_STIFF - guy.vy * GRAB_DAMP) * dt;
          guy.x += guy.vx * dt;
          guy.y += guy.vy * dt;
          guy.squash *= Math.exp(-9 * dt);
          g.grabTravel += Math.hypot(guy.x - before.x, guy.y - before.y);
          g.grabTilt = Math.max(-0.42, Math.min(0.42, guy.vx * 0.00042));
          if (Math.abs(guy.vx) > 60) guy.facing = guy.vx < 0 ? -1 : 1;
          // dangle him long enough and he has opinions about it
          const holdBeats = [3, 7.5, 13];
          if (g.holdLinesSaid < HOLD_LINES.length && guy.phaseT > holdBeats[g.holdLinesSaid]) {
            say(HOLD_LINES[g.holdLinesSaid], 2.2);
            g.holdLinesSaid += 1;
          }
          break;
        }
        case "flying": {
          const { impacts, atRest } = stepFlight(guy, dt);
          for (const im of impacts) {
            g.worstImpact = Math.max(g.worstImpact, im.strength);
            beepRef.current(170, 70, 0.09, "triangle", Math.min(0.09, im.strength / 9000));
            g.shake = Math.min(9, im.strength / 130);
            // the harder the hit, the bigger the mess
            burst(g.particles, im.x, im.y, "puff", Math.min(13, 3 + Math.round(im.strength / 260)));
            if (im.strength > 1150) {
              burst(g.particles, im.x, im.y, "ring", 1);
              burst(g.particles, im.x, im.y, "star", Math.min(5, Math.round(im.strength / 600)));
            }
            rattle(im.x, im.y, im.strength);
            if (im.onDesk) {
              burst(g.particles, im.x, DESK.top - 8, "paper", 7);
              beepRef.current(900, 500, 0.06, "square", 0.03);
              jostleDeskProps(im.strength, im.x);
            }
            if (im.y < 90 && Math.abs(im.x - 480) < 150) {
              g.lightSwingV += Math.max(-6, Math.min(6, guy.vx * 0.006));
            }
          }
          // Come to rest on the desktop? Shove him off the nearer edge so he
          // always ends up on the floor — he can only walk back from there.
          // Must be genuinely *settled on the surface*, not merely passing over
          // it near the top of an arc — a loose test here relaunches him every
          // time he floats above the desk and the flight never ends.
          const overDesk = guy.x > DESK.x - 6 && guy.x < DESK.x + DESK.w + 6;
          const deskRestY = DESK.top - 6 - BODY_R;
          const restingOnDesk =
            overDesk && Math.abs(guy.vy) < 40 && Math.abs(guy.y - deskRestY) < 7;
          if (restingOnDesk) {
            // Shove him toward an edge he can actually clear. The desk's right
            // end sits flush against the wall, so pushing him that way just
            // rebounds him onto the desktop — pick the side with real room.
            const rightEscape = DESK.x + DESK.w + 6 < WALL_R - BODY_R;
            const goLeft = !rightEscape || guy.x < DESK.x + DESK.w / 2;
            guy.vx = (goLeft ? -1 : 1) * 340;
            guy.vy = -150;
            guy.vrot = (goLeft ? -1 : 1) * 4;
            guy.deskPass = true; // he's sliding off; stop the desk catching him
            burst(g.particles, guy.x, DESK.top - 8, "paper", 4);
          }
          // Watchdog: however he is thrown, he gets up and goes back to work.
          // If flight somehow never settles, put him down anyway.
          if (guy.phaseT > 5) {
            guy.x = Math.min(Math.max(guy.x, 90), 900);
            settleOnFloor(guy);
            guy.phase = "dazed";
            guy.phaseT = 0;
            guy.facing = Math.random() < 0.5 ? -1 : 1;
            say(pick(DAZED_LINES), 1.4);
            g.pendingRowLoss += rowLoss(g.worstImpact);
            g.worstImpact = 0;
            break;
          }
          if (atRest) {
            settleOnFloor(guy);
            guy.phase = "dazed";
            guy.phaseT = 0;
            guy.facing = Math.random() < 0.5 ? -1 : 1;
            say(pick(DAZED_LINES), 1.4);
            burst(g.particles, guy.x, FLOOR_Y - 40, "star", 3);
            g.pendingRowLoss += rowLoss(g.worstImpact);
            g.worstImpact = 0;
          }
          break;
        }
        case "dazed": {
          if (guy.phaseT > DAZE_TIME) {
            // Turn to face the desk before peeling himself off the floor, so
            // the rise flows straight into the walk back.
            guy.facing = SEAT_X > guy.x ? 1 : -1;
            guy.phase = "rising";
            guy.phaseT = 0;
            guy.vx = 0;
            burst(g.particles, guy.x, FLOOR_Y - 6, "puff", 4);
          }
          break;
        }
        case "rising": {
          if (guy.phaseT >= RISE_TIME) startReturn();
          break;
        }
        case "sitting": {
          if (guy.phaseT >= SIT_TIME) {
            guy.phaseT = 0;
            if (g.stormPending) {
              g.stormPending = false;
              guy.phase = "typing";
              g.screenMode = "compose";
              g.composeT = 0;
              meltdownBegan();
            } else {
              guy.phase = "working";
              g.screenMode = "work";
              g.rowFlow = 0;
              // the damage report: he sees exactly what the flight cost him
              if (g.pendingRowLoss > 0) {
                g.rows = Math.max(0, g.rows - g.pendingRowLoss);
                g.pendingRowLoss = 0;
                say(`row ${Math.floor(g.rows).toLocaleString()}… again.`, 2.6);
                persist();
              } else if (!g.bubble) {
                say(pick(MUTTERS[tier()]), 2.4);
              }
              // the stare he owes you comes before the work resumes
              if (g.stareOwed) {
                g.stareOwed = false;
                g.stareUntil = g.t + 3;
                g.bubble = null;
              }
              // he quietly puts his things back where they belong
              for (const p of g.props) {
                if (p.state === "resting" || p.state === "broken") {
                  const broke = p.state === "broken";
                  burst(g.particles, p.x, p.y, "puff", 2);
                  resetProp(p);
                  burst(g.particles, p.x, p.y, broke ? "steam" : "puff", 2);
                }
              }
            }
          }
          break;
        }
        case "returning":
        case "storming": {
          const storm = guy.phase === "storming";
          const top = storm ? STORM_SPEED : WALK_SPEED;
          const target = g.walkTarget ?? SEAT_X;
          const dist = target - guy.x;
          const dir = dist > 0 ? 1 : -1;
          guy.facing = dir as 1 | -1;
          guy.y = FLOOR_Y;

          // Ease up to speed, and ease back down over the last stretch so he
          // arrives at the chair instead of stopping dead in front of it.
          const approach = Math.min(1, Math.abs(dist) / 90);
          const desired = dir * top * Math.max(0.22, approach);
          guy.vx += (desired - guy.vx) * Math.min(1, dt * WALK_ACCEL);
          guy.x += guy.vx * dt;
          guy.walkPhase += Math.abs(guy.vx) * dt * 0.05;

          if (Math.abs(target - guy.x) < 5 || dir !== (target - guy.x > 0 ? 1 : -1)) {
            g.walkTarget = null;
            guy.x = SEAT_X;
            guy.y = FLOOR_Y;
            guy.vx = 0;
            guy.facing = 1;
            guy.phase = "sitting";
            guy.phaseT = 0;
            g.stormPending = storm;
          }
          break;
        }
        case "typing": {
          g.composeT = Math.min(1, g.composeT + dt / 3.4);
          if (g.t > g.nextClackAt) {
            beepRef.current(1300 + Math.random() * 700, 1100, 0.025, "square", 0.02);
            g.nextClackAt = g.t + 0.07 + Math.random() * 0.06;
          }
          if (g.composeT >= 1 && guy.phaseT > 3.6) {
            guy.phase = "sent";
            guy.phaseT = 0;
            g.screenMode = "sent";
            g.shake = 7;
            beepRef.current(380, 950, 0.3, "sine", 0.07);
            void sendTheEmail();
          }
          break;
        }
        case "sent":
          break;
        case "despair": {
          // head down on the dead keyboard; the overlay arrives mid-grief
          if (g.cableOverlayAt !== null && g.t >= g.cableOverlayAt) {
            g.cableOverlayAt = null;
            overlayRef.current({ kind: "cablePulled", lost: g.cableRowsLost });
          }
          if (guy.phaseT >= DESPAIR_TIME) {
            guy.phase = "working";
            guy.phaseT = 0;
            g.screenMode = "work";
            g.rowFlow = 0;
            g.cablePulled = false; // he crawls under the desk and replugs it
          }
          break;
        }
      }

      // ambient timers that don't care what phase he's in
      g.flinchT = Math.max(0, g.flinchT - dt);
      if (g.confessionUntil < g.t) g.confessionText = null;
      if (g.t - g.lastSavedAt > 10) persist();

      // draw
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      const seated =
        guy.phase === "working" ||
        guy.phase === "typing" ||
        guy.phase === "sent" ||
        guy.phase === "sitting" ||
        guy.phase === "despair";
      const bubbleAnchor = seated
        ? { x: SEAT_HEAD_X, y: SEAT_HEAD_Y - 34 }
        : {
            x: guy.x,
            y:
              guy.phase === "dazed" || guy.phase === "rising"
                ? FLOOR_Y - 78
                : guy.y - 150,
          };
      // eased 0→1 for the two transition poses; 1 everywhere else
      const transition =
        guy.phase === "rising"
          ? // slow gather, quick push, settle — easeOutBack peaks almost
            // immediately and made the get-up read as an instant snap
            easeInOutQuad(clamp01(guy.phaseT / RISE_TIME))
          : guy.phase === "sitting"
            ? easeOutCubic(clamp01(guy.phaseT / SIT_TIME))
            : 1;
      const rs: RenderState = {
        t: g.t,
        guy,
        grabTilt: g.grabTilt,
        tier: guy.phase === "typing" || guy.phase === "sent" ? 3 : tier(),
        face:
          g.faceOverride ??
          (guy.phase === "sent" ? "dazed" : guy.phase === "grabbed" || guy.phase === "flying" ? "worried" : "normal"),
        incidents: g.incidents,
        lifetimeIncidents: g.mem.lifetimeIncidents,
        particles: g.particles,
        props: g.props,
        bubble: g.bubble ? { text: g.bubble.text, ...bubbleAnchor } : null,
        rows: { done: Math.floor(g.rows), target: ROWS_TARGET },
        stare: guy.phase === "working" ? Math.max(0, g.stareUntil - g.t) : 0,
        flinch: clamp01(g.flinchT * 3),
        cable: {
          armed: guy.phase === "typing" && g.composeT >= CABLE_ARM_AT && !g.cablePulled,
          pulled: g.cablePulled,
        },
        confession: g.confessionText,
        lightSwing: g.lightSwing,
        lightFlicker: Math.max(0, g.lightFlickerUntil - g.t),
        posterTilt: g.posterTilt,
        plantWob: g.plantWob,
        transition,
        screen: { mode: g.screenMode, composeT: g.composeT },
        shake: g.shake,
        clockH,
        clockM,
      };
      render(ctx, rs);
    };

    const tick = (nowMs: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((nowMs - last) / 1000, 0.033);
      last = nowMs;
      advance(dt);
    };

    // Dev-only hook so tests can step the simulation deterministically.
    if (process.env.NODE_ENV === "development") {
      (window as unknown as { __botherAdvance?: (dt: number) => void }).__botherAdvance = advance;
      (window as unknown as { __botherState?: Game }).__botherState = g;
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      G.current = null;
    };
  }, []);

  /* ── pointer interaction ────────────────────────────────── */
  function toWorld(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  const inBox = (p: { x: number; y: number }, box: { x: number; y: number; w: number; h: number }) =>
    p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;

  /**
   * Grabbable prop under the pointer, or -1. The padded hit boxes overlap
   * where the mug and stapler sit side by side, so take the nearest center
   * rather than the first match. (Kev is checked before any prop.)
   */
  function propUnder(g: Game, p: { x: number; y: number }): number {
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < g.props.length; i++) {
      const pr = g.props[i];
      if (pr.state === "broken" || pr.state === "held") continue;
      if (!inBox(p, propHitBox(pr))) continue;
      const d = (p.x - pr.x) ** 2 + (p.y - pr.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = G.current;
    if (!g || blockedRef.current) return;
    const p = toWorld(e);
    g.pointer = { ...p, history: [{ ...p, t: nowSecs() }] };

    const capture = () => {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic or already-released pointer — grabbing works regardless */
      }
    };

    if (GRAB_STATES.includes(g.guy.phase) && inBox(p, guyHitBox(g.guy))) {
      capture();
      g.guy.phase = "grabbed";
      g.guy.phaseT = 0;
      g.walkTarget = null;
      g.guy.deskPass = false;
      g.grabTravel = 0;
      g.holdLinesSaid = 0;
      g.guy.vy = 0;
      g.guy.vx = 0;
      g.guy.rot = 0;
      beepRef.current(300, 150, 0.08, "square", 0.045);
      return;
    }

    const pi = propUnder(g, p);
    if (pi >= 0) {
      capture();
      g.heldProp = pi;
      const pr = g.props[pi];
      pr.state = "held";
      pr.vx = 0;
      pr.vy = 0;
      pr.vrot = 0;
      beepRef.current(500, 320, 0.05, "square", 0.03);
      return;
    }

    // the other trolley track: yank the plug while the email is being typed
    if (g.guy.phase === "typing" && g.composeT >= CABLE_ARM_AT && !g.cablePulled && inBox(p, CABLE_HIT)) {
      pullCable(g);
    }
  }

  /** The choice: kill the email by killing his screen — and half his rows. */
  function pullCable(g: Game) {
    g.cablePulled = true;
    g.guy.phase = "despair";
    g.guy.phaseT = 0;
    g.screenMode = "off";
    const lost = Math.floor(Math.floor(g.rows) / 2);
    g.cableRowsLost = lost;
    g.rows = Math.max(0, g.rows - lost);
    g.mem.cablePulls += 1;
    g.mem.trust = clampTrust(g.mem.trust + TRUST.cablePull);
    g.mem.rows = Math.floor(g.rows);
    saveMemory(g.mem);
    g.bothers = 0;
    g.threshold = randThresholdBrittle(); // he's brittle now
    g.workSlowUntil = g.t + BRITTLE_WORK_SECS;
    g.stormPending = false;
    g.whyPending = false; // this act asks its own question
    g.cableOverlayAt = g.t + 2.6;
    g.bubble = { text: DESPAIR_LINE, until: g.t + 3 };
    setUi({ bothers: 0, tier: 0 });
    // the dying whine of a monitor losing power
    beepRef.current(800, 40, 0.5, "sine", 0.06);
    beepRef.current(120, 30, 0.4, "triangle", 0.05);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const g = G.current;
    if (!g) return;
    const p = toWorld(e);
    const t = performance.now() / 1000;
    g.pointer.x = p.x;
    g.pointer.y = p.y;
    const h = g.pointer.history;
    h.push({ ...p, t });
    while (h.length > 7 || (h.length > 1 && t - h[0].t > 0.1)) h.shift();

    if (g.guy.phase === "grabbed" || g.heldProp !== null) {
      e.currentTarget.style.cursor = "grabbing";
    } else if (!blockedRef.current) {
      const overGuy = GRAB_STATES.includes(g.guy.phase) && inBox(p, guyHitBox(g.guy));
      const overCable =
        g.guy.phase === "typing" && g.composeT >= CABLE_ARM_AT && !g.cablePulled && inBox(p, CABLE_HIT);
      e.currentTarget.style.cursor = overCable
        ? "pointer"
        : overGuy || propUnder(g, p) >= 0
          ? "grab"
          : "default";
    }
  }

  /** Flick velocity from recent pointer travel, or the carried momentum if livelier. */
  function flickVelocity(g: Game, curVx: number, curVy: number): { vx: number; vy: number } {
    const h = g.pointer.history;
    let vx = 0;
    let vy = 0;
    if (h.length >= 2) {
      const a = h[0];
      const b = h[h.length - 1];
      const dt = Math.max(0.016, b.t - a.t);
      vx = (b.x - a.x) / dt;
      vy = (b.y - a.y) / dt;
    }
    // Take whichever is livelier: the flick the pointer described, or the
    // momentum the grab spring already gave the body. Blending them means a
    // fast flick still throws hard, while simply letting go mid-swing carries
    // its real motion through instead of dropping it dead.
    if (Math.hypot(curVx, curVy) > Math.hypot(vx, vy)) {
      vx = curVx;
      vy = curVy;
    }
    const speed = Math.hypot(vx, vy);
    const cap = speed > MAX_THROW ? MAX_THROW / speed : 1;
    return { vx: vx * cap, vy: vy * cap };
  }

  /**
   * Let go of whatever is held — Kev or a prop — converting recent pointer
   * travel into throw velocity. Safe to call twice (the window-level safety
   * net and the canvas handler both fire) — it no-ops unless something is
   * actually being held.
   */
  function releaseGrab() {
    const g = G.current;
    if (!g) return;

    if (g.heldProp !== null) {
      const pr = g.props[g.heldProp];
      g.heldProp = null;
      const v = flickVelocity(g, pr.vx, pr.vy);
      pr.vx = v.vx;
      pr.vy = v.vy;
      pr.vrot = pr.vx * 0.006 + (Math.random() - 0.5) * 5;
      pr.state = "flying";
      const speed = Math.hypot(v.vx, v.vy);
      if (speed > 500) beepRef.current(600, 200, 0.12, "sawtooth", 0.025);
      // he notices you messing with his desk — protest, but not a bother
      if (speed > 260 && g.guy.phase === "working" && Date.now() - g.lastPropLineAt > 9000) {
        g.lastPropLineAt = Date.now();
        g.bubble = { text: PROP_MISS_LINES[Math.floor(Math.random() * PROP_MISS_LINES.length)], until: g.t + 2.4 };
      }
      return;
    }

    if (g.guy.phase !== "grabbed") return;
    const v = flickVelocity(g, g.guy.vx, g.guy.vy);
    g.guy.vx = v.vx;
    g.guy.vy = v.vy;
    g.guy.vrot = g.guy.vx * 0.004 + (Math.random() - 0.5) * 3;
    g.guy.phase = "flying";
    g.guy.phaseT = 0;

    // every grab-and-release is a bother, gentle or not — and he remembers
    g.bothers += 1;
    g.incidents += 1;
    g.mem.lifetimeIncidents += 1;
    g.mem.trust = clampTrust(g.mem.trust + TRUST.incident);
    g.lastBotherAt = Date.now();
    g.peaceAccum = 0;
    g.rowFlow = 0;
    setUi({ bothers: g.bothers, tier: tierFor(g.bothers, g.threshold) });
    if (Math.hypot(v.vx, v.vy) > 500) beepRef.current(700, 180, 0.16, "sawtooth", 0.035);
  }

  const releaseRef = useRef(releaseGrab);
  useEffect(() => {
    releaseRef.current = releaseGrab;
  });

  // Safety net: a release that lands outside the canvas (or a pointer the
  // browser never captured) must still let go of him.
  useEffect(() => {
    const onUp = () => releaseRef.current();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    releaseGrab();
    e.currentTarget.style.cursor = "default";
  }

  /* ── overlay actions ────────────────────────────────────── */

  /**
   * Leaving any meltdown-terminal overlay detours through the one question
   * he never asks out loud. Answering (or declining to) is what resets.
   */
  function finishMeltdownOverlay() {
    const g = G.current;
    if (g?.whyPending) {
      setOverlay({ kind: "why" });
      return;
    }
    closeOverlayAndReset();
  }

  function answerWhy(answer: WhyAnswer) {
    const g = G.current;
    if (g) {
      g.whyPending = false;
      g.mem.lastWhy = answer;
      saveMemory(g.mem);
      // feed the crowd tally; refresh what the whiteboard can show
      fetch("/api/bother", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "why", answer }),
      })
        .then((r) => r.json())
        .then((d: { ok: boolean; counts?: Record<WhyAnswer, number> }) => {
          if (d.ok && d.counts && G.current) G.current.whyCounts = d.counts;
        })
        .catch(() => {});
    }
    closeOverlayAndReset();
  }

  /** "He won't remember any of it. You will." */
  function eraseKevMemory() {
    const g = G.current;
    wipeMemory();
    setWipeArmed(false);
    if (!g) return;
    g.mem = loadMemory();
    g.mem.visits = 1;
    g.mem.lastVisitAt = wallNow();
    saveMemory(g.mem);
    g.rows = 0;
    g.pendingRowLoss = 0;
    g.incidents = 0;
    g.meltdownsThisSession = 0;
    g.whyPending = false;
    g.stareOwed = false;
    g.stareUntil = 0;
    g.peaceShown = false;
    g.greetingPending = false; // a stranger gets no greeting
    closeOverlayAndReset();
    g.bubble = null; // and he has nothing to say about it
  }

  function closeOverlayAndReset() {
    const g = G.current;
    setOverlay(null);
    setApology("idle");
    if (!g) return;
    g.bothers = 0;
    g.threshold = randThreshold();
    g.screenMode = "work";
    g.composeT = 0;
    g.guy.phase = "working";
    g.guy.phaseT = 0;
    g.guy.x = SEAT_X;
    g.guy.y = FLOOR_Y;
    g.guy.facing = 1;
    g.guy.vx = 0;
    g.guy.vy = 0;
    g.guy.rot = 0;
    g.guy.squash = 0;
    g.walkTarget = null;
    g.stormPending = false;
    g.heldProp = null;
    for (const p of g.props) resetProp(p);
    g.posterSkew = 0;
    g.bubble = { text: "…back to work, I guess.", until: g.t + 2.6 };
    setUi({ bothers: 0, tier: 0 });
  }

  async function sendApology() {
    const g = G.current;
    if (!g || apology === "sending") return;
    setApology("sending");
    try {
      const res = await fetch("/api/bother", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "apology",
          bothers: g.incidents,
          seconds: Math.round((Date.now() - g.startedAt) / 1000),
        }),
      });
      const data = (await res.json()) as { ok: boolean; demo?: boolean };
      if (data.ok) {
        beep(660, 880, 0.25, "sine", 0.06);
        setOverlay({ kind: "apologized", demo: !!data.demo });
        if (g) {
          g.faceOverride = "happy";
          g.faceOverrideUntil = g.t + 6;
          g.mem.apologies += 1;
          g.mem.trust = clampTrust(g.mem.trust + TRUST.apology);
          saveMemory(g.mem);
        }
      } else {
        setOverlay({ kind: "limit" });
      }
    } catch {
      setOverlay({ kind: "failed" });
    }
    setApology("idle");
  }

  const moodEmoji = ["🙂", "😒", "😠", "🤬"][ui.tier];

  return (
    <div className="max-w-[960px]">
      <div
        ref={wrapRef}
        className="relative w-full overflow-hidden rounded-md border border-border bg-surface"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Kev's office. Drag Kev with your mouse or finger and let go to throw him. His coffee mug and stapler can be picked up and thrown too."
          className="block w-full touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />

        {/* HUD */}
        <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full border border-border bg-header/80 px-3 py-1 text-xs font-semibold text-fg backdrop-blur">
            Bothers: {ui.bothers}
          </span>
          <span
            className="rounded-full border border-border bg-header/80 px-2 py-1 text-xs backdrop-blur"
            role="img"
            aria-label={`Kev's mood: ${["content", "annoyed", "angry", "furious"][ui.tier]}`}
          >
            {moodEmoji}
          </span>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
            className="rounded-full border border-border bg-header/80 p-1.5 text-icon backdrop-blur hover:text-fg"
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setIntro(true)}
            aria-label="How this game works"
            className="rounded-full border border-border bg-header/80 p-1.5 text-icon backdrop-blur hover:text-fg"
          >
            <CircleHelp size={15} />
          </button>
        </div>

        {/* intro / moral contract */}
        {intro && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">This is Kev.</h2>
            <div className="space-y-2.5 text-sm text-muted">
              <p>
                He&apos;s just trying to get through his inbox. You can pick him up and fling him
                around his office as much as you like — he&apos;ll always dust himself off and go
                back to work. He always does.
              </p>
              <p className="text-fg">
                But know this: every bother pushes him closer to the edge. After a random number of
                them — you&apos;ll never know which one — he will snap, sit down at his computer,
                and send the <strong>real Kevin</strong> a genuinely hurtful email.{" "}
                <strong>A real email, to his real inbox.</strong>{" "}He&apos;ll read it.
              </p>
              <p>Kev doesn&apos;t want to send it. Whether he has to is up to you.</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setIntro(false)} className={BTN_PRIMARY}>
                I understand
              </button>
              <Link href="/" className={BTN_SECONDARY}>
                Leave him in peace
              </Link>
            </div>
            <p className="mt-3 text-xs text-muted">
              The emails are real (and rate-limited, mercifully). The apology button afterwards is
              real too.
            </p>
            <div className="mt-3 border-t border-border pt-3">
              {!wipeArmed ? (
                <button
                  type="button"
                  onClick={() => setWipeArmed(true)}
                  className="text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
                >
                  Reset Kev&apos;s memory of you
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs text-fg">
                    He won&apos;t remember any of it. You will.
                  </span>
                  <button
                    type="button"
                    onClick={eraseKevMemory}
                    className="text-xs font-semibold text-coral hover:underline"
                  >
                    Erase
                  </button>
                  <button
                    type="button"
                    onClick={() => setWipeArmed(false)}
                    className="text-xs text-muted hover:text-fg"
                  >
                    Keep
                  </button>
                </div>
              )}
            </div>
          </Overlay>
        )}

        {/* aftermath */}
        {overlay?.kind === "sent" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">It happened.</h2>
            <div className="rounded-md border border-border bg-bg p-3 font-mono text-xs">
              <div className="text-muted">
                to: <span className="text-fg">kevin (the real one)</span>
              </div>
              <div className="text-muted">
                subject: <span className="text-fg">{overlay.subject}</span>
              </div>
              <div className="mt-2 border-t border-border pt-2 text-fg">
                “{overlay.line}”
              </div>
              <div className="mt-1.5 text-muted">
                …a stranger threw me around the office until I snapped. This is on both of you. — Kev
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">
              {overlay.demo ? (
                <>
                  <span className="font-semibold text-fg">Demo mode:</span>{" "}no email key is
                  configured, so this one was only logged. On the live site it lands in
                  Kevin&apos;s actual inbox.
                </>
              ) : (
                <>
                  That was really sent. Kevin will really read it.{" "}
                  <span className="text-fg">You did this together.</span>
                </>
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendApology}
                disabled={apology === "sending"}
                className={BTN_PRIMARY}
              >
                {apology === "sending" ? "Sending…" : "Send a real apology"}
              </button>
              <button type="button" onClick={finishMeltdownOverlay} className={BTN_SECONDARY}>
                Let him get back to work
              </button>
            </div>
          </Overlay>
        )}

        {overlay?.kind === "limit" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">Outbox full.</h2>
            <p className="text-sm text-muted">
              The email bounced. Kev has sent enough hurtful messages today — Kevin&apos;s inbox
              needs a break. Kev stared at the screen for a second, sighed, and deleted the draft.
            </p>
            <p className="mt-2 text-sm text-fg">Somehow, this feels like mercy.</p>
            <div className="mt-4">
              <button type="button" onClick={finishMeltdownOverlay} className={BTN_PRIMARY}>
                Let him get back to work
              </button>
            </div>
          </Overlay>
        )}

        {overlay?.kind === "failed" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">The wifi saved you.</h2>
            <p className="text-sm text-muted">
              Kev hammered SEND, but the office network failed him. The email never went through.
              He doesn&apos;t know that yet. Let&apos;s not tell him.
            </p>
            <div className="mt-4">
              <button type="button" onClick={finishMeltdownOverlay} className={BTN_PRIMARY}>
                Let him get back to work
              </button>
            </div>
          </Overlay>
        )}

        {overlay?.kind === "apologized" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">He passed it along.</h2>
            <p className="text-sm text-muted">
              A real apology is on its way to Kevin&apos;s inbox
              {overlay.demo ? " (well — logged, in demo mode)" : ""}. Kev read it over twice before
              sending. He seems lighter.
            </p>
            <div className="mt-4">
              <button type="button" onClick={finishMeltdownOverlay} className={BTN_PRIMARY}>
                Let him get back to work
              </button>
            </div>
          </Overlay>
        )}

        {/* the question he never asks out loud */}
        {overlay?.kind === "why" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">One thing, before you go on.</h2>
            <p className="text-sm text-muted">Why did you do it?</p>
            <div className="mt-4 flex flex-col gap-2">
              <button type="button" onClick={() => answerWhy("funny")} className={BTN_SECONDARY}>
                it was funny
              </button>
              <button type="button" onClick={() => answerWhy("curious")} className={BTN_SECONDARY}>
                I wanted to see what would happen
              </button>
              <button type="button" onClick={() => answerWhy("dunno")} className={BTN_SECONDARY}>
                I don&apos;t know
              </button>
            </div>
            <button
              type="button"
              onClick={() => answerWhy("silent")}
              className="mt-3 text-xs text-muted underline-offset-2 hover:text-fg hover:underline"
            >
              say nothing
            </button>
          </Overlay>
        )}

        {/* the other trolley track */}
        {overlay?.kind === "cablePulled" && (
          <Overlay>
            <h2 className="mb-2 text-lg font-semibold text-fg">You pulled the plug.</h2>
            <p className="text-sm text-muted">
              The email died with the screen. The real Kevin will never read it — you saved him
              that. Kev lost the draft, and{" "}
              <span className="text-fg">{overlay.lost.toLocaleString()} rows</span>
              {" "}of the quarter went with it. He hasn&apos;t lifted his head yet.
            </p>
            <p className="mt-2 text-sm text-fg">
              Nobody got what they wanted. Maybe that was the choice.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  setOverlay(null);
                  setApology("idle");
                }}
                className={BTN_PRIMARY}
              >
                Leave him be
              </button>
            </div>
          </Overlay>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        Drag Kev to pick him up; flick to throw. His mug and stapler throw too — mind the mug. He
        gets over it. Mostly. Leave him alone for a while and he calms down.
      </p>
    </div>
  );
}

const BTN_PRIMARY =
  "rounded-md bg-green px-3.5 py-1.5 text-sm font-semibold text-white hover:opacity-90";
const BTN_SECONDARY =
  "rounded-md border border-border bg-btn px-3.5 py-1.5 text-sm font-semibold text-fg hover:bg-btn-hover";

/**
 * Full-screen modal on phones (the canvas box is far too short to hold the
 * text — the buttons would be stranded below a nested scroll), and an
 * in-canvas panel from md up.
 */
function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px] md:absolute md:z-10">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border border-border bg-surface p-5 shadow-2xl md:max-h-full"
      >
        {children}
      </div>
    </div>
  );
}
