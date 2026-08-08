"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eraser, Languages, Send } from "lucide-react";
import { ContributionGraph } from "./ContributionGraph";

/** 3-wide x 5-tall bitmap font, '1' = filled. */
const FONT: Record<string, string[]> = {
  A: ["111", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["111", "001", "001", "101", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "011"],
  R: ["111", "101", "110", "101", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  // Greek capitals with no Latin twin (keys are Greek code points)
  Γ: ["111", "100", "100", "100", "100"],
  Δ: ["010", "101", "101", "101", "111"],
  Θ: ["010", "101", "111", "101", "010"],
  Λ: ["010", "101", "101", "101", "101"],
  Ξ: ["111", "000", "111", "000", "111"],
  Π: ["111", "101", "101", "101", "101"],
  Σ: ["111", "100", "010", "100", "111"],
  Φ: ["010", "111", "101", "111", "010"],
  Ψ: ["101", "101", "111", "010", "010"],
  Ω: ["010", "101", "101", "010", "111"],
};

// Greek capitals that share a Latin glyph (left side is the Greek code point).
for (const [greek, latin] of [
  ["Α", "A"], ["Β", "B"], ["Ε", "E"], ["Ζ", "Z"], ["Η", "H"], ["Ι", "I"], ["Κ", "K"],
  ["Μ", "M"], ["Ν", "N"], ["Ο", "O"], ["Ρ", "P"], ["Τ", "T"], ["Υ", "Y"], ["Χ", "X"],
] as const) {
  FONT[greek] = FONT[latin];
}

const MAX = 82;
const LINE_H = 6; // 5 glyph rows + 1 spacer row per line

/** One graph at every scale: more lines → smaller cells and more of them.
    The glyph "font" is 3x5 cells, so cell size is the font size. Every tier
    targets the same ~772px rendered width as the classic 53-week graph. */
const TIERS = [
  { cell: 11, gap: 3, cols: 53, maxLines: 1 }, // the real GitHub year
  { cell: 7, gap: 2, cols: 82, maxLines: 2 },
  { cell: 5, gap: 2, cols: 106, maxLines: 3 },
] as const;

type Tier = (typeof TIERS)[number];

/** advance: 4 cols per glyph (3 + 1 spacer), 3 per space — matches the render loop below */
function colWidth(text: string): number {
  return text.split("").reduce((a, c) => a + (c === " " ? 3 : 4), 0) - 1;
}

/** Greedy word-wrap at spaces; words longer than a line are hard-broken. */
function wrapLines(text: string, usable: number): string[] {
  const maxChars = Math.floor((usable + 1) / 4);
  const words = text
    .split(/ +/)
    .filter(Boolean)
    .flatMap((w) => {
      const parts: string[] = [];
      for (let i = 0; i < w.length; i += maxChars) parts.push(w.slice(i, i + maxChars));
      return parts;
    });
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const joined = line ? `${line} ${w}` : w;
    if (colWidth(joined) <= usable) {
      line = joined;
    } else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [" "];
}

/** Pick the largest scale whose line budget fits the text. */
function layout(text: string): { tier: Tier; lines: string[] } {
  for (const tier of TIERS) {
    const lines = wrapLines(text, tier.cols - 2); // 1 col of breathing space per side
    if (lines.length <= tier.maxLines) return { tier, lines };
  }
  const tier = TIERS[TIERS.length - 1];
  return { tier, lines: wrapLines(text, tier.cols - 2) };
}

function linesToGrid(lines: string[], cols: number, level = 3): number[][] {
  const rows = 1 + lines.length * LINE_H;
  const grid = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  lines.forEach((line, i) => {
    const top = 1 + i * LINE_H;
    const total = colWidth(line);
    let col = Math.max(1, Math.floor((cols - total) / 2));
    // Uppercase and strip accents so é→E and ά→Α resolve to font keys.
    const glyphs = line.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const c of glyphs) {
      if (c === " ") {
        col += 3;
        continue;
      }
      const bmp = FONT[c];
      if (!bmp) {
        col += 4;
        continue;
      }
      for (let r = 0; r < 5; r++) {
        for (let x = 0; x < bmp[r].length; x++) {
          if (bmp[r][x] === "1") {
            const gr = top + r;
            const gc = col + x;
            if (gc >= 0 && gc < cols && gr < rows) grid[gr][gc] = level;
          }
        }
      }
      col += 4;
    }
  });
  return grid;
}

type SendState = "idle" | "sending" | "sent" | "error";
type TransState = "idle" | "loading" | "error";
type Lang = "es" | "en" | "el" | "fr" | "zh";

const LANG_LABELS: { key: Lang; label: string }[] = [
  { key: "es", label: "Spanish" },
  { key: "en", label: "English" },
  { key: "el", label: "Greek" },
  { key: "fr", label: "French" },
  { key: "zh", label: "Mandarin" },
];

/** Uppercase, strip accents, and drop anything the bitmap font can't draw
    (Latin, Greek capitals, and digits survive; CJK has no 3x5 glyphs). */
function toDrawable(text: string): string {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\u0391-\u03a9 ]/g, " ")
    .replace(/ +/g, " ")
    .trim()
    .slice(0, MAX);
}

export function WordGraph({ initialWord = "KEVIN" }: { initialWord?: string }) {
  const [word, setWord] = useState(initialWord);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [transState, setTransState] = useState<TransState>("idle");
  const [translations, setTranslations] = useState<{
    word: string;
    entries: Record<Lang, string>;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const didMount = useRef(false);
  const reqId = useRef(0);
  const { tier, lines } = useMemo(() => layout(word.trim()), [word]);
  const data = useMemo(() => linesToGrid(lines, tier.cols, 3), [lines, tier]);

  function clear() {
    setWord("");
    setSendState("idle");
    setTransState("idle");
    setTranslations(null);
    reqId.current++; // drop any in-flight translation
    inputRef.current?.focus();
  }

  // Real-time translation: debounce while typing, drop stale responses.
  // Skips the initial mount so page loads don't burn API calls.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const text = word.trim();
    if (!text || text === translations?.word) return;
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      setTransState("loading");
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: text }),
        });
        if (!res.ok) throw new Error("bad status");
        const json = await res.json();
        if (id !== reqId.current) return; // a newer request superseded this one
        setTranslations({ word: text, entries: json.translations });
        setTransState("idle");
      } catch {
        if (id === reqId.current) setTransState("error");
      }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  async function send() {
    if (!word.trim() || sendState === "sending" || sendState === "sent") return;
    setSendState("sending");
    try {
      const res = await fetch("/api/graph-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim() }),
      });
      if (!res.ok) throw new Error("bad status");
      setSendState("sent");
    } catch {
      setSendState("error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          value={word}
          onChange={(e) => {
            const next = e.target.value.replace(/[^a-zA-Z0-9\u0370-\u03ff ]/g, "").slice(0, MAX);
            setWord(next);
            setSendState("idle");
            if (!next.trim()) {
              // emptied the board \u2014 dismiss translations and cancel in-flight requests
              setTranslations(null);
              setTransState("idle");
              reqId.current++;
            }
          }}
          maxLength={MAX}
          placeholder="Type a word or sentence…"
          aria-label="Type a word to render it in the contribution graph"
          className="h-8 w-72 max-w-full rounded-md border border-border bg-input px-2.5 text-sm text-fg outline-none transition-colors focus:border-link"
        />
        <span className="font-mono text-xs text-muted">
          {word.length}/{MAX}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            disabled={!word}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-btn px-3 text-xs font-medium text-fg transition-colors hover:bg-btn-hover disabled:opacity-50"
          >
            <Eraser size={13} />
            Clear
          </button>
          <button
            type="button"
            onClick={send}
            disabled={!word.trim() || sendState === "sending" || sendState === "sent"}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-green px-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {sendState === "sent" ? <Check size={13} /> : <Send size={13} />}
            {sendState === "sending" ? "Sending…" : sendState === "sent" ? "Sent!" : "Send to me"}
          </button>
        </div>
      </div>
      {sendState === "error" && (
        <p className="mb-3 text-xs text-muted">Something went wrong. Give it another try.</p>
      )}
      {transState === "error" && (
        <p className="mb-3 text-xs text-muted">Translation didn&apos;t go through. Keep typing to retry.</p>
      )}
      {!translations && transState === "loading" && (
        <p className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted">
          <Languages size={12} />
          Translating…
        </p>
      )}
      {translations && (
        <div className="mb-4 overflow-hidden rounded-md border border-border">
          <p className="flex items-center gap-1.5 border-b border-border bg-band px-3 py-1.5 text-xs text-muted">
            <Languages size={12} />
            &ldquo;{translations.word}&rdquo; in five languages
            {transState === "loading" && <span className="ml-auto">translating…</span>}
          </p>
          <ul className="divide-y divide-border text-sm">
            {LANG_LABELS.map(({ key, label }) => {
              const text = translations.entries[key] ?? "";
              const drawable = toDrawable(text);
              return (
                <li key={key} className="flex items-center gap-3 px-3 py-1.5">
                  <span className="w-20 shrink-0 text-xs text-muted">{label}</span>
                  <span className="min-w-0 flex-1 break-words text-fg">{text}</span>
                  {drawable && (
                    <button
                      type="button"
                      onClick={() => {
                        setWord(drawable);
                        setSendState("idle");
                      }}
                      className="shrink-0 text-xs text-link hover:underline"
                    >
                      Draw it
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <ContributionGraph
        data={data}
        cell={tier.cell}
        gap={tier.gap}
        ariaLabel={`Contribution graph spelling ${word.trim() || "nothing"}`}
      />
    </div>
  );
}
