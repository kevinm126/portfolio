# Portfolio — Setup & Go-Live Guide

Everything here works the moment you run it. Features that need an account run on
realistic **demo data** until you add a key. Flip them on one at a time.

```bash
npm install
npm run dev          # http://localhost:3000
```

---

## 1. Your content (do this first)

All text/data lives in **one file**: [`src/content/content.ts`](src/content/content.ts).
Search it for `TODO:` and replace. That single file drives the hero, about, skills,
experience, projects, the AI chatbot's knowledge, the terminal, and metadata.

Also:
- **Résumé** — drop your real PDF at `public/resume.pdf` (replaces the placeholder).
- **Headshot** — add `public/avatar.jpg` (optional; the monogram is used otherwise).
- **Domain** — set your URL in `src/app/layout.tsx` (`metadataBase`) and in
  `src/app/robots.ts` / `src/app/sitemap.ts`.

---

## 2. Turn features live (optional)

Copy `.env.example` → `.env.local`, add a key, restart `npm run dev`.

| Feature | Var(s) | Where to get it |
|---|---|---|
| **AI chatbot** ("Ask my résumé") | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| **GitHub stats** | `githubUsername` in content.ts (+ optional `GITHUB_TOKEN`) | [github.com/settings/tokens](https://github.com/settings/tokens) (classic, no scopes) |
| **Spotify now-playing** | `SPOTIFY_CLIENT_ID` / `SECRET` / `REFRESH_TOKEN` | see below |
| **WakaTime** | `WAKATIME_API_KEY` | [wakatime.com/settings/account](https://wakatime.com/settings/account) |
| **Contact email + Bother Kev emails** | `RESEND_API_KEY` | [resend.com](https://resend.com) |
| **Community chess (your move key)** | `CHESS_ADMIN_KEY` | any secret string you choose (see §3) |
| **Guestbook/views/chess (durable)** | `UPSTASH_REDIS_REST_URL` / `_TOKEN` | [upstash.com](https://upstash.com) (see §3) |

### Spotify (one-time)
1. Create an app at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
   Add redirect URI `http://localhost:3000`.
2. Copy the Client ID/Secret.
3. Get a refresh token (scope `user-read-currently-playing user-read-recently-played`)
   — easiest via [this guide](https://github.com/leerob/leerob.io#now-playing-) or any
   "Spotify refresh token" helper. Paste all three into `.env.local`.

The chatbot model is set in [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts)
(`claude-haiku-4-5` — fast and cheap). The résumé text it's grounded in is generated
from your content in [`src/content/resume.ts`](src/content/resume.ts).

---

## 3. Guestbook, views & community chess in production

The dev store ([`src/lib/store.ts`](src/lib/store.ts)) is **in-memory** — fine locally,
but it resets on restart and isn't shared across Vercel's serverless instances.
For real persistence, create an Upstash Redis DB and swap the reads/writes in
`src/app/api/guestbook/route.ts`, `src/app/api/views/route.ts`, and
`src/app/api/chess/route.ts` for Redis calls (`npm i @upstash/redis`). The interfaces
are tiny and commented.

**Community chess** ([`/chess`](src/app/chess/page.tsx) → *Community game*) is one shared
correspondence game: the public plays White, you play Black. Your moves are gated by
`CHESS_ADMIN_KEY` — set it to any secret string. To play your reply, visit
`/chess?admin=YOUR_KEY` once; the key is saved in your browser (`localStorage`) and the
query param is stripped from the URL. Until you move, the board stays locked for everyone
else. Without the env var set, a `kevin-dev` fallback is used so it works out of the box
locally — **change it before deploying.**

---

## 3b. Bother Kev — the game that emails you

[`/bother`](src/app/bother/page.tsx) is a hand-drawn canvas office game: visitors pick up
and throw a little coworker ("Kev"), who always trudges back to his desk. After a **random,
hidden number of bothers** (9–17, re-rolled every meltdown) he storms to his computer and
**emails you a real, hurtful message**. Players are told this upfront by the intro dialog —
that contract is the whole point of the piece.

**Your lines live in [`src/content/bother-lines.ts`](src/content/bother-lines.ts)** and ship
with mild placeholders marked `CONFIRM:`. Replace `HURTFUL_LINES` with your own list; one
string per message, picked at random. **That file is server-only** — it is imported solely by
`src/app/api/bother/route.ts`, so the lines never reach the browser bundle and players can't
read ahead. Never import it from a client component.

**Where the mail goes.** Set `BOTHER_EMAIL_TO` to keep the game's output out of your main
inbox; it falls back to `profile.email` if unset. It's an env var rather than a literal so the
address isn't published in this repo. The contact form is separate and always uses
`profile.email`.

**Getting real delivery for free — no domain, no card.** Resend's shared sender
(`onboarding@resend.dev`) may only deliver to *the address that owns the Resend account*. So
rather than buying a domain, **sign up at [resend.com](https://resend.com) using the same
address you put in `BOTHER_EMAIL_TO`.** That makes the destination "your own" address, the
shared sender is allowed to reach it, and the free tier (100/day, 3,000/month) covers it. Paste
the key into `RESEND_API_KEY` and nothing else needs to change.

The game's own caps below (8 hurtful + 10 apology per day) sit far under 100/day, so the free
tier can't realistically be exceeded.

Only if you later want mail sent to a *different* inbox than the account's do you need a
verified domain: add one at [resend.com/domains](https://resend.com/domains) and set
`RESEND_FROM` to an address on it. Without that, Resend returns `403` — the route logs an
explicit hint when it sees one.

Emails go out through the same Resend key as the contact form. Without `RESEND_API_KEY` they
are logged server-side and the game says "demo mode" in the aftermath dialog. Rate limits
(hard-coded in the route, since the store is in-memory):

| Limit | Value |
|---|---|
| Hurtful email, per IP | 1 per 10 min, 3 per day |
| Hurtful email, global | 8 per day |
| Apology email | 1 per IP per 10 min, 10 per day global |

Over the limit, the game plays an "Outbox full" beat instead of pretending it sent. The
apology button in the aftermath dialog sends a real (also rate-limited) email.

After a meltdown the game asks "why did you do it?" — answers land in the same in-memory
store (today's tallies surface on Kev's whiteboard). Like the chess game, that store resets
on redeploy; swap to Upstash if the confessions should survive. Everything Kev remembers
about a visitor (trust, lifetime incidents, his spreadsheet progress) lives in that
visitor's own localStorage — nothing personal is stored server-side.

---

## 4. Deploy (Vercel)

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new) — it auto-detects Next.js.
3. Add your `.env.local` vars in **Project → Settings → Environment Variables**.
4. Deploy. Add a custom domain if you have one.

```bash
npm run build        # sanity-check the production build locally first
```

---

## Feature map (where things live)

- GitHub-profile chrome (header, tabs, sidebar, footer) → `src/components/github/*`
- Welcome page (README + projects + contribution graph) → `src/app/page.tsx`
- Portfolio + repo filter/search/sort → `src/app/portfolio/page.tsx`, `components/github/RepoFilterList.tsx`
- Research reviews → `src/app/research/page.tsx`, `components/github/ResearchList.tsx` (papers in `content.ts`)
- Chess (community correspondence + vs-bot) → `src/components/chess/*` + `src/app/api/chess/route.ts`
- Bother Kev (canvas office game) → `src/components/bother/{engine,draw}.ts` + `BotherGame.tsx`, `src/app/api/bother/route.ts`, lines in `src/content/bother-lines.ts` (server-only)
- Contribution graph you can type words into → `src/components/features/WordGraph.tsx`, `ContributionGraph.tsx`
- Command palette (⌘K) → `src/components/layout/command-palette.tsx`
- Terminal mode (`/terminal`) → `src/components/features/terminal.tsx`
- Copilot-style AI chatbot → `src/components/github/CopilotChat.tsx` + `src/app/api/chat/route.ts`
- Light/dark theme toggle → `src/app/providers.tsx` + `globals.css` (`html[data-theme]`) + `AvatarMenu.tsx`
- Guestbook / page-views / chess store → `src/lib/store.ts` + matching `src/app/api/*`
- Case studies → `src/app/projects/[slug]/page.tsx`
