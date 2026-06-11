import { profile } from "@/content/content";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let data: { name?: string; email?: string; message?: string } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const { name, email, message } = data;
  if (!name || !email || !message) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  // Live mode: if RESEND_API_KEY is set, email it (see SETUP.md to enable).
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
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
    } catch (err) {
      console.error("[contact] resend error:", err);
    }
  }

  // Demo mode: log it so the form flow works end-to-end without a key.
  console.log("[contact] (demo mode) message:", { name, email, message });
  return Response.json({ ok: true, demo: true });
}
