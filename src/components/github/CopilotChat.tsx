"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { profile } from "@/content/content";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };
const first = profile.name.split(" ")[0];

const GREETING: Msg = {
  role: "assistant",
  content: `Hi! I'm ${first} — well, an AI version of me, grounded in my résumé. Ask me about my experience, skills, or projects.`,
};
const SUGGESTIONS = [
  "What's your strongest skill?",
  "Tell me about MetricPath",
  "Are you good with Python?",
  "How do I contact you?",
];

function CopilotGlyph({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 4c-3 0-4 1.2-4 3.2 0 .2 0 .4.05.6C6.3 8.2 5 9.6 5 11.6v3.1C5 17.6 8 19 12 19s7-1.4 7-4.3v-3.1c0-2-1.3-3.4-3.05-3.8.05-.2.05-.4.05-.6C16 5.2 15 4 12 4Zm-2.4 7.4a1.2 1.2 0 0 1 1.2 1.2v1.2a1.2 1.2 0 0 1-2.4 0v-1.2a1.2 1.2 0 0 1 1.2-1.2Zm4.8 0a1.2 1.2 0 0 1 1.2 1.2v1.2a1.2 1.2 0 0 1-2.4 0v-1.2a1.2 1.2 0 0 1 1.2-1.2Z" />
    </svg>
  );
}

export function CopilotChat() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("chat:open", onOpen);
    return () => window.removeEventListener("chat:open", onOpen);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open, loading]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply ?? "No answer came back." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Sorry — I couldn't reach the server." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open Copilot assistant"
        className="fixed bottom-5 right-5 z-50 flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-fg shadow-2xl transition hover:bg-btn-hover"
      >
        {open ? <X size={20} /> : <CopilotGlyph />}
        {!open && <span className="hidden sm:inline">Ask Copilot</span>}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[30rem] max-h-[calc(100vh-6.5rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-2xl">
          <header className="flex items-center gap-2 border-b border-border bg-surface px-4 py-3">
            <span className="text-fg">
              <CopilotGlyph size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-fg">Copilot</p>
              <p className="text-xs text-muted">Ask my résumé</p>
            </div>
          </header>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 space-y-3 overflow-y-auto p-4"
          >
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-md border px-3 py-2 text-sm",
                    m.role === "user"
                      ? "border-green/40 bg-green/15 text-fg"
                      : "border-border bg-btn text-fg"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-md border border-border bg-btn px-4 py-3 text-sm text-muted">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                  </span>
                </div>
              </div>
            )}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted transition hover:border-link hover:text-link"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Ask about my work"
              placeholder="Ask about my work…"
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-fg outline-none focus:border-link"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 items-center justify-center rounded-md bg-green text-white disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
