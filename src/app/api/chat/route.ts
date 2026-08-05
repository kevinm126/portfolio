import { resumeText, cannedAnswers } from "@/content/resume";
import { profile } from "@/content/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "user" | "assistant"; content: string };

/**
 * Provider chain, best to cheapest:
 *   1. Claude (ANTHROPIC_API_KEY) — best quality, pay-as-you-go (pennies at
 *      portfolio traffic, but needs purchased credits).
 *   2. Gemini (GEMINI_API_KEY) — Google AI Studio free tier, card-free.
 *   3. Canned answers — always work, no key at all.
 * A provider that errors falls through to the next tier instead of surfacing
 * a failure to the visitor.
 */

const first = profile.name.split(" ")[0];

function buildSystem(): string {
  return (
    `You are an AI stand-in for ${profile.name}, embedded on his portfolio site. ` +
    `Speak in the FIRST PERSON, as ${first} ("I", "my") — the whole site is written in his voice. ` +
    `Answer visitor questions using ONLY the context below. Be concise (2-4 sentences), warm, and concrete. ` +
    `If something isn't in the context, say you're not sure and suggest emailing ${profile.email}. ` +
    `If asked whether you're really ${first}, be honest that you're an AI version of him. ` +
    `Never invent facts.\n\n=== CONTEXT (résumé) ===\n${resumeText}`
  );
}

/** Conversations must start with a user turn (both providers require it). */
function buildHistory(messages: ChatMsg[], last: string): ChatMsg[] {
  const history = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
  while (history.length && history[0].role === "assistant") history.shift();
  return history.length ? history : [{ role: "user", content: last }];
}

async function askClaude(apiKey: string, system: string, history: ChatMsg[]): Promise<string> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });
  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system,
    messages: history,
  });
  return resp.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n")
    .trim();
}

/**
 * Gemini via plain REST — no SDK dependency. Free-tier keys come from
 * Google AI Studio (aistudio.google.com, no card). Model overridable via
 * GEMINI_MODEL if the default is ever renamed.
 */
async function askGemini(apiKey: string, system: string, history: ChatMsg[]): Promise<string> {
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: 500 },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const reply = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!reply) throw new Error("Gemini returned an empty reply");
  return reply;
}

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ reply: "Bad request." }, { status: 400 });
  }

  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const system = buildSystem();
  const history = buildHistory(messages, last);

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const reply = await askClaude(anthropicKey, system, history);
      return Response.json({ reply: reply || "…" });
    } catch (err) {
      console.error("[chat] Claude error, falling through:", err);
    }
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const reply = await askGemini(geminiKey, system, history);
      return Response.json({ reply });
    } catch (err) {
      console.error("[chat] Gemini error, falling through:", err);
    }
  }

  // ── Floor: canned answers (no key, or every provider failed) ───────────
  const hit =
    cannedAnswers.find((c) => c.q.test(last)) ?? cannedAnswers[cannedAnswers.length - 1];
  return Response.json({ reply: hit.a, demo: !anthropicKey && !geminiKey });
}
