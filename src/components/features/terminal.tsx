"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  profile,
  socials,
  skillGroups,
  projects,
  experience,
  education,
} from "@/content/content";

type Line = { kind: "in" | "out" | "err" | "sys"; text: string };

const BANNER = String.raw`
  _  __         _        __  __            _
 | |/ /        (_)      |  \/  |          (_)
 | ' / _____   ___ _ __ | \  / | __ _ _ __ _ _ __
 |  < / _ \ \ / / | '_ \| |\/| |/ _' | '__| | '_ \
 | . \  __/\ V /| | | | | |  | | (_| | |  | | | | |
 |_|\_\___| \_/ |_|_| |_|_|  |_|\__,_|_|  |_|_| |_|
`;

export function Terminal() {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => [
    { kind: "sys", text: BANNER },
    { kind: "sys", text: `Welcome to ${profile.name}'s portfolio terminal. v1.0` },
    { kind: "sys", text: `Type 'help' to see commands, or 'gui' to return to the site.` },
    { kind: "sys", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = useCallback((text: string, kind: Line["kind"] = "out") => {
    setLines((l) => [...l, { kind, text }]);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, busy]);

  const commands: Record<string, (args: string[]) => void | Promise<void>> = {
    help: () =>
      print(
        [
          "Available commands:",
          "  about        whoami and bio",
          "  skills       tech stack",
          "  projects     featured work",
          "  experience   work history",
          "  education    schooling",
          "  contact      how to reach me",
          "  social       my links",
          "  resume       open my résumé",
          "  ask <q>      ask my AI assistant a question",
          "  clear        clear the screen",
          "  gui / exit   return to the graphical site",
        ].join("\n")
      ),
    about: () => print([`${profile.name}: ${profile.tagline}`, "", ...profile.about].join("\n")),
    whoami: () => print(profile.name),
    skills: () =>
      print(
        skillGroups
          .map((g) => `${g.category.padEnd(14)} ${g.items.map((i) => i.name).join(", ")}`)
          .join("\n")
      ),
    projects: () =>
      print(
        projects
          .map(
            (p) =>
              `• ${p.title}\n    ${p.blurb}\n    ${p.tags.join(", ")}${
                p.metrics ? `  [${p.metrics.map((m) => `${m.value} ${m.label}`).join(", ")}]` : ""
              }`
          )
          .join("\n\n")
      ),
    experience: () =>
      print(
        experience
          .map((x) => `• ${x.role} @ ${x.org} (${x.start}–${x.end})\n    ${x.summary}`)
          .join("\n\n")
      ),
    education: () =>
      print(education.map((e) => `• ${e.credential}, ${e.school} (${e.start}–${e.end})`).join("\n")),
    contact: () => print(`email: ${profile.email}\nlocation: ${profile.location}`),
    social: () => print(socials.map((s) => `${s.label.padEnd(10)} ${s.href}`).join("\n")),
    resume: () => {
      print("Opening résumé…", "sys");
      window.open(profile.resumeUrl, "_blank");
    },
    clear: () => setLines([]),
    gui: () => {
      print("Returning to site…", "sys");
      router.push("/");
    },
    exit: () => {
      router.push("/");
    },
    ls: () => print("about  skills  projects  experience  education  contact  resume"),
    echo: (args) => print(args.join(" ")),
    sudo: () => print("Nice try. 🙂", "err"),
    ask: async (args) => {
      const q = args.join(" ").trim();
      if (!q) return print("usage: ask <your question>", "err");
      setBusy(true);
      print(`thinking…`, "sys");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: q }] }),
        });
        const data = await res.json();
        setLines((l) => [
          ...l.slice(0, -1), // drop the "thinking…" line
          { kind: "out", text: `🤖 ${data.reply ?? "no answer"}` },
        ]);
      } catch {
        setLines((l) => [...l.slice(0, -1), { kind: "err", text: "request failed" }]);
      } finally {
        setBusy(false);
      }
    },
  };

  async function run(raw: string) {
    const cmd = raw.trim();
    setLines((l) => [...l, { kind: "in", text: cmd }]);
    if (!cmd) return;
    setHistory((h) => [cmd, ...h]);
    setHIdx(-1);

    const [name, ...args] = cmd.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (fn) {
      await fn(args);
    } else {
      print(`command not found: ${name}. Type 'help'.`, "err");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !busy) {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const ni = Math.min(hIdx + 1, history.length - 1);
      if (history[ni] !== undefined) {
        setHIdx(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = hIdx - 1;
      if (ni < 0) {
        setHIdx(-1);
        setInput("");
      } else {
        setHIdx(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  const color = (k: Line["kind"]) =>
    k === "err" ? "text-red-400" : k === "sys" ? "text-green" : k === "in" ? "text-fg" : "text-muted";

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-[#07080d] font-mono text-sm text-muted"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
        <span className="h-3 w-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-muted">visitor@{profile.initials.toLowerCase()} · bash</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push("/");
          }}
          className="ml-auto rounded px-2 py-0.5 text-muted hover:bg-surface hover:text-fg"
        >
          exit ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 leading-relaxed">
        {lines.map((l, i) => (
          <div
            key={i}
            className={`${
              l.text === BANNER
                ? "whitespace-pre text-[clamp(6.5px,2.3vw,14px)] leading-[1.15]"
                : "whitespace-pre-wrap"
            } ${color(l.kind)}`}
          >
            {l.kind === "in" ? (
              <span>
                <span className="text-green-400">visitor@{profile.initials.toLowerCase()}</span>
                <span className="text-muted">:</span>
                <span className="text-green">~</span>
                <span className="text-muted">$ </span>
                {l.text}
              </span>
            ) : (
              l.text
            )}
          </div>
        ))}

        {/* live prompt */}
        <div className="flex items-center">
          <span className="text-green-400">visitor@{profile.initials.toLowerCase()}</span>
          <span className="text-muted">:</span>
          <span className="text-green">~</span>
          <span className="text-muted">$&nbsp;</span>
          <input
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-fg [caret-color:var(--accent-green)] outline-none"
          />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}
