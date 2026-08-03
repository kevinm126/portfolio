import { profile } from "@/content/content";
import { SITE_URL } from "@/lib/site";
import { EMPTY_WHY, store, type WhyCounts } from "@/lib/store";
import { buildApologyEmail, buildHurtEmail, HURTFUL_LINES } from "@/content/bother-lines";

export const dynamic = "force-dynamic";

/**
 * Kev's outbox. Sends the real email when he snaps (and real apologies).
 * Aggressively rate-limited so Kevin's inbox survives the internet:
 *   - 1 hurtful email per IP per 10 minutes, 3 per IP per day
 *   - 8 hurtful emails per day, globally
 *   - 1 apology per IP per 10 minutes, 10 per day globally
 * Over the limit → { ok: false, reason: "limit" } and the game plays the
 * "outbox full" beat instead of pretending it sent.
 */

const TEN_MIN = 10 * 60 * 1000;
const MAX_HURTS_PER_IP_PER_DAY = 3;
const MAX_HURTS_PER_DAY = 8;
const MAX_APOLOGIES_PER_DAY = 10;

/**
 * Where Kev's outbursts land. Set BOTHER_EMAIL_TO to keep the game's mail out
 * of your main inbox — it's deliberately an env var rather than a literal so
 * the address isn't published in this repo. Falls back to the contact address.
 */
function recipient(): string {
  const to = process.env.BOTHER_EMAIL_TO?.trim();
  return to && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) ? to : profile.email;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ledgerFor(ip: string) {
  const b = store.bother;
  if (b.day !== today()) {
    b.day = today();
    b.hurtsToday = 0;
    b.apologiesToday = 0;
    b.byIp = {};
    b.why = { ...EMPTY_WHY };
  }
  if (!b.byIp[ip]) b.byIp[ip] = { lastHurtAt: 0, lastApologyAt: 0, hurtsToday: 0 };
  return { global: b, ip: b.byIp[ip] };
}

/** Today's confession tally, for the whiteboard's "MEANWHILE:" beat. */
export async function GET() {
  ledgerFor("probe"); // rolls the day over if needed
  return Response.json({ ok: true, counts: store.bother.why });
}

async function sendEmail(subject: string, text: string): Promise<{ sent: boolean; demo: boolean }> {
  const resendKey = process.env.RESEND_API_KEY;
  const to = recipient();
  if (!resendKey) {
    console.log("[bother] (demo mode) email:", { to, subject, text });
    return { sent: true, demo: true };
  }
  // The shared onboarding@resend.dev sender delivers only to the address that
  // owns the Resend account — which is free and needs no domain, provided the
  // account was created with BOTHER_EMAIL_TO as its address. RESEND_FROM is
  // only needed to reach some *other* inbox, and requires a verified domain.
  const from = process.env.RESEND_FROM?.trim() || "Kev <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (res.ok) return { sent: true, demo: false };
    const body = await res.text().catch(() => "");
    console.error(`[bother] resend refused (${res.status}) sending to ${to} from ${from}:`, body);
    if (res.status === 403) {
      console.error(
        `[bother] 403 means Resend won't deliver to ${to} from ${from}. The free ` +
          "fix: make sure your Resend account was signed up with that exact " +
          "address (the shared sender only mails the account owner). To reach a " +
          "different inbox you must verify a domain and set RESEND_FROM."
      );
    }
  } catch (err) {
    console.error("[bother] resend error:", err);
  }
  return { sent: false, demo: false };
}

export async function POST(req: Request) {
  let data: { kind?: string; bothers?: number; seconds?: number; answer?: string } = {};
  try {
    data = await req.json();
  } catch {
    return Response.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const kind = data.kind === "apology" ? "apology" : data.kind === "why" ? "why" : "hurt";
  const bothers = Math.min(Math.max(Math.round(Number(data.bothers) || 0), 0), 999);
  const seconds = Math.min(Math.max(Math.round(Number(data.seconds) || 0), 0), 86_400);

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const { global, ip: ledger } = ledgerFor(ip);
  const now = Date.now();

  // "why did you do it?" — fixed choices only, lightly rate-limited
  if (kind === "why") {
    const answer = String(data.answer) as keyof WhyCounts;
    if (!(answer in global.why)) {
      return Response.json({ ok: false, reason: "bad-request" }, { status: 400 });
    }
    if (now - (ledger.lastWhyAt ?? 0) < 20_000) {
      return Response.json({ ok: true, counts: global.why }); // silently ignore spam
    }
    ledger.lastWhyAt = now;
    global.why[answer] += 1;
    return Response.json({ ok: true, counts: global.why });
  }

  if (kind === "hurt") {
    if (
      now - ledger.lastHurtAt < TEN_MIN ||
      ledger.hurtsToday >= MAX_HURTS_PER_IP_PER_DAY ||
      global.hurtsToday >= MAX_HURTS_PER_DAY
    ) {
      return Response.json({ ok: false, reason: "limit" });
    }

    const line = HURTFUL_LINES[Math.floor(Math.random() * HURTFUL_LINES.length)];
    const { subject, text } = buildHurtEmail({ line, bothers, seconds, siteUrl: SITE_URL });
    const { sent, demo } = await sendEmail(subject, text);
    if (!sent) return Response.json({ ok: false, reason: "send-failed" });

    ledger.lastHurtAt = now;
    ledger.hurtsToday += 1;
    global.hurtsToday += 1;
    return Response.json({ ok: true, line, subject, demo });
  }

  // apology
  if (now - ledger.lastApologyAt < TEN_MIN || global.apologiesToday >= MAX_APOLOGIES_PER_DAY) {
    return Response.json({ ok: false, reason: "limit" });
  }
  const { subject, text } = buildApologyEmail({ bothers, siteUrl: SITE_URL });
  const { sent, demo } = await sendEmail(subject, text);
  if (!sent) return Response.json({ ok: false, reason: "send-failed" });

  ledger.lastApologyAt = now;
  global.apologiesToday += 1;
  return Response.json({ ok: true, demo });
}
