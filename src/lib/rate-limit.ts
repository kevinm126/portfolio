/**
 * Shared rate limiter for the endpoints that send real email.
 *
 * Every mail-sending route draws on the same Resend key, and its free tier is
 * 100 messages a day. Without a cap, one person hammering the contact form
 * burns the whole allowance and silently takes the other features down with
 * it. The per-endpoint quotas below are chosen so the worst case stays under
 * that ceiling with room to spare:
 *
 *   contact 40  +  graph-share 10  +  bother 8 hurts  +  10 apologies  =  68/day
 *
 * Caveat, same as the rest of `store`: this ledger is process-local, so on
 * serverless each warm instance keeps its own copy and the real ceiling is the
 * quota times the number of live instances. It is a spend guard, not a
 * security boundary. Swap in Upstash (see SETUP.md) for a hard global cap.
 */

export type Quota = {
  /** Minimum gap between two sends from one IP, in ms. */
  cooldownMs: number;
  /** Per-IP daily cap. */
  perIpPerDay: number;
  /** Cap across everyone, per day. */
  globalPerDay: number;
};

export const QUOTAS = {
  contact: { cooldownMs: 60_000, perIpPerDay: 5, globalPerDay: 40 },
  "graph-share": { cooldownMs: 10 * 60_000, perIpPerDay: 3, globalPerDay: 10 },
} as const satisfies Record<string, Quota>;

type Bucket = {
  day: string; // YYYY-MM-DD the counters belong to
  total: number;
  byIp: Record<string, { last: number; today: number }>;
};

const g = globalThis as unknown as { __portfolioRateLimit?: Record<string, Bucket> };
g.__portfolioRateLimit ??= {};
const buckets = g.__portfolioRateLimit;

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for` at the edge; the last
 * entry is the one closest to the platform and hardest for a caller to forge
 * by prepending their own header.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "cooldown" | "ip-daily" | "global-daily" };

/**
 * Check the quota and, if there is room, immediately consume one unit.
 * Call this *before* sending; on a send failure call `refund` so a bounced
 * message doesn't cost the sender their allowance.
 */
export function consume(name: keyof typeof QUOTAS, ip: string, now = Date.now()): LimitResult {
  const q: Quota = QUOTAS[name];
  const b = (buckets[name] ??= { day: today(), total: 0, byIp: {} });
  if (b.day !== today()) {
    b.day = today();
    b.total = 0;
    b.byIp = {};
  }
  const seen = (b.byIp[ip] ??= { last: 0, today: 0 });

  if (b.total >= q.globalPerDay) return { ok: false, reason: "global-daily" };
  if (seen.today >= q.perIpPerDay) return { ok: false, reason: "ip-daily" };
  if (now - seen.last < q.cooldownMs) return { ok: false, reason: "cooldown" };

  seen.last = now;
  seen.today += 1;
  b.total += 1;
  return { ok: true };
}

/** Hand back a unit consumed for a send that never actually went out. */
export function refund(name: keyof typeof QUOTAS, ip: string) {
  const b = buckets[name];
  if (!b) return;
  const seen = b.byIp[ip];
  if (seen) {
    seen.today = Math.max(0, seen.today - 1);
    seen.last = 0;
  }
  b.total = Math.max(0, b.total - 1);
}
