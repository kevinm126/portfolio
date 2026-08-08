import { profile } from "@/content/content";
import { clientIp, consume, refund } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * The contact form's outbox.
 *
 * Two rules earn their keep here, because a dropped message from a recruiter
 * is the most expensive thing this site can do:
 *
 *   1. Only report success when a message is genuinely on its way. Without a
 *      RESEND_API_KEY there is nothing to fail, so demo mode is honest. *With*
 *      a key, a refused send is a real failure and the sender is told, rather
 *      than being shown a checkmark over a message that went nowhere.
 *   2. Whatever happens, log the message. If delivery fails it is still
 *      recoverable from the server logs instead of lost.
 */

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  let data: { name?: string; email?: string; message?: string } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const name = (data.name ?? "").toString().trim().slice(0, 120);
  const email = (data.email ?? "").toString().trim().slice(0, 200);
  const message = (data.message ?? "").toString().trim().slice(0, 5000);
  if (!name || !email || !message) {
    return Response.json({ ok: false, reason: "missing-fields" }, { status: 400 });
  }
  // A malformed address makes Resend refuse the whole send, so catch it here
  // where we can say something useful instead of surfacing a generic failure.
  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, reason: "bad-email" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;

  // No key at all: nothing can fail, so the success is truthful.
  if (!resendKey) {
    console.log("[contact] (demo mode) message:", { name, email, message });
    return Response.json({ ok: true, demo: true });
  }

  const ip = clientIp(req);
  const limit = consume("contact", ip);
  if (!limit.ok) {
    console.warn(`[contact] rate limited (${limit.reason}) from ${ip}`);
    console.warn("[contact] UNSENT message:", { name, email, message });
    return Response.json({ ok: false, reason: "limit" }, { status: 429 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Portfolio <onboarding@resend.dev>",
        to: [profile.email],
        reply_to: email,
        subject: `Portfolio message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });
    if (res.ok) return Response.json({ ok: true });
    const body = await res.text().catch(() => "");
    console.error(`[contact] resend refused (${res.status}):`, body);
  } catch (err) {
    console.error("[contact] resend error:", err);
  }

  // The send did not happen. Don't spend the sender's quota on it, keep the
  // message where it can be recovered, and tell them the truth so they can
  // fall back to emailing directly.
  refund("contact", ip);
  console.error("[contact] UNDELIVERED message:", { name, email, message });
  return Response.json({ ok: false, reason: "send-failed" }, { status: 502 });
}
