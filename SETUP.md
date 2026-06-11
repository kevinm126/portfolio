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
| **Contact email** | `RESEND_API_KEY` | [resend.com](https://resend.com) |
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
- Contribution graph you can type words into → `src/components/features/WordGraph.tsx`, `ContributionGraph.tsx`
- Command palette (⌘K) → `src/components/layout/command-palette.tsx`
- Terminal mode (`/terminal`) → `src/components/features/terminal.tsx`
- Copilot-style AI chatbot → `src/components/github/CopilotChat.tsx` + `src/app/api/chat/route.ts`
- Light/dark theme toggle → `src/app/providers.tsx` + `globals.css` (`html[data-theme]`) + `AvatarMenu.tsx`
- Guestbook / page-views / chess store → `src/lib/store.ts` + matching `src/app/api/*`
- Case studies → `src/app/projects/[slug]/page.tsx`
