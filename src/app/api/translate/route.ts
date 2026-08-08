export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WORD = 82;
const LANGS = ["es", "en", "el", "fr", "zh"] as const;
type Lang = (typeof LANGS)[number];

// Real-time typing repeats words constantly — cache to spare the upstream APIs.
const cache = new Map<string, Record<Lang, string>>();
const CACHE_CAP = 300;

function remember(key: string, translations: Record<Lang, string>) {
  if (cache.size >= CACHE_CAP) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, translations);
}

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

  const cacheKey = word.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached) {
    return Response.json({ translations: cached, cached: true });
  }

  // Live mode: one Claude call covers all five languages with auto-detected source.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: "You are a translator. Reply with ONLY a JSON object. No prose, no code fences.",
        messages: [
          {
            role: "user",
            content:
              `Translate the text below into Spanish, English, Greek, French, and Mandarin Chinese (simplified). ` +
              `Reply with only JSON shaped {"es":"…","en":"…","el":"…","fr":"…","zh":"…"}. ` +
              `If the text is already in one of those languages, use it verbatim for that key.\n\nText: ${word}`,
          },
        ],
      });
      const raw = resp.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("")
        .trim()
        .replace(/^```(?:json)?\s*|\s*```$/g, "");
      const json = JSON.parse(raw) as Record<string, unknown>;
      const translations = Object.fromEntries(
        LANGS.map((l) => [l, (json[l] ?? "").toString().trim().slice(0, 200)])
      ) as Record<Lang, string>;
      if (LANGS.every((l) => translations[l])) {
        remember(cacheKey, translations);
        return Response.json({ translations });
      }
    } catch (err) {
      console.error("[translate] anthropic error:", err);
    }
  }

  // Demo mode: MyMemory's free API, no key needed, with source auto-detection.
  // The target matching the detected source returns a "distinct languages"
  // error — the input already is that language, so echo it verbatim.
  try {
    const results = await Promise.all(
      LANGS.map(async (l) => {
        const target = l === "zh" ? "zh-CN" : l;
        // MyMemory's translation memory is case-sensitive and all-caps queries
        // often hit junk identical-text entries — lowercase for better matches.
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.toLowerCase())}&langpair=${encodeURIComponent(`Autodetect|${target}`)}`
        );
        const j = await res.json();
        const status = Number(j?.responseStatus);
        const t = j?.responseData?.translatedText;
        if (status === 200 && typeof t === "string" && t.trim()) return [l, t.trim()] as const;
        if (status === 403 && typeof t === "string" && /DISTINCT LANGUAGES/i.test(t)) {
          return [l, word] as const;
        }
        return [l, ""] as const;
      })
    );
    const translations = Object.fromEntries(results) as Record<Lang, string>;
    if (LANGS.every((l) => translations[l])) {
      remember(cacheKey, translations);
      return Response.json({ translations, demo: true });
    }
  } catch (err) {
    console.error("[translate] fallback error:", err);
  }

  return Response.json({ error: "Translation unavailable" }, { status: 502 });
}
