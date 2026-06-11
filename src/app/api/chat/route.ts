import { resumeText, cannedAnswers } from "@/content/resume";
import { profile } from "@/content/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ reply: "Bad request." }, { status: 400 });
  }

  const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Demo mode: no key, use canned answers ──────────────────────────────
  if (!apiKey) {
    const hit =
      cannedAnswers.find((c) => c.q.test(last)) ??
      cannedAnswers[cannedAnswers.length - 1];
    return Response.json({ reply: hit.a, demo: true });
  }

  // ── Live mode: ground Claude in the résumé text ────────────────────────
  try {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey });

    const system =
      `You are the friendly AI assistant embedded on ${profile.name}'s portfolio. ` +
      `Answer visitor questions about ${profile.name} using ONLY the context below. ` +
      `Refer to him as "${profile.name.split(" ")[0]}". Be concise (2-4 sentences), warm, and concrete. ` +
      `If something isn't in the context, say so and suggest emailing ${profile.email}. ` +
      `Never invent facts.\n\n=== CONTEXT (résumé) ===\n${resumeText}`;

    // Anthropic requires the conversation to start with a user turn.
    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.content }));
    while (history.length && history[0].role === "assistant") history.shift();

    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system,
      messages: history.length ? history : [{ role: "user", content: last }],
    });

    const reply = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("\n")
      .trim();

    return Response.json({ reply: reply || "…" });
  } catch (err) {
    console.error("[chat] error:", err);
    return Response.json({
      reply: `I hit an error reaching the model. You can reach ${profile.name} directly at ${profile.email}.`,
      error: true,
    });
  }
}
