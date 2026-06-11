import { profile } from "@/content/content";

export const dynamic = "force-dynamic";

const MAX_WORD = 82;

export async function POST(req: Request) {
  let data: { word?: string } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  const word = (data.word ?? "")
    .toString()
    .replace(/[^a-zA-Z0-9\u0370-\u03ff ]/g, "")
    .trim()
    .slice(0, MAX_WORD);
  if (!word) {
    return Response.json({ error: "Missing word" }, { status: 400 });
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
          subject: "Someone drew on your contribution graph",
          text: `A visitor typed this into the contribution graph:\n\n"${word}"`,
        }),
      });
      if (res.ok) return Response.json({ ok: true });
    } catch (err) {
      console.error("[graph-share] resend error:", err);
    }
  }

  // Demo mode: log it so the flow works end-to-end without a key.
  console.log("[graph-share] (demo mode) word:", word);
  return Response.json({ ok: true, demo: true });
}
