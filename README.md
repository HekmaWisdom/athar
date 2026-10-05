# Athar (أثر) — Web App

Live at **[web-vert-three-39.vercel.app](https://web-vert-three-39.vercel.app)**. This folder is the actual product — a React 19 + TanStack Start app talking directly to Supabase (Postgres + Auth + Edge Functions), no separate backend API.

If you're reading this because you cloned `github.com/HekmaWisdom/athar`, you're in the right place — this repo *is* this folder. For the wider project (product docs, brand, the original architecture plan, a competitor screenshot dump), see the parent `Quotes App/` folder and its [`SETUP.md`](../../SETUP.md) — this README only covers running and deploying the app itself.

## Stack at a glance

| Layer | What | Notes |
|---|---|---|
| Framework | React 19 + TanStack Start (file-based routing, SSR) | Bundler is Vite, not webpack — `npm run dev` runs `vite dev` |
| Build config | `@lovable.dev/vite-tanstack-config` (real npm dependency) | This project was originally scaffolded and edited in [Lovable](https://lovable.dev); the editor is no longer used, but this config package still supplies the TanStack Start + Tailwind + Nitro + sandbox-detection Vite setup. **Don't hand-roll a replacement `vite.config.ts`** — see the comment at the top of that file for what it silently provides. |
| UI | Tailwind v4 + shadcn/Radix components (`src/components/ui/`) | Standard shadcn setup, `components.json` present |
| Data + Auth | Supabase (project `wydnzsgepqqdqibxgyea`) | Postgres with RLS, no custom REST layer — `src/lib/quotes.ts` etc. call `supabase.from(...)` directly |
| Server functions | TanStack `createServerFn` (none currently in use) | Would run server-side (Nitro) if added; the app talks to Supabase directly |
| Push notifications | Web Push (VAPID) + Supabase Edge Function + `pg_cron` | `public/sw.js` service worker, `supabase/functions/send-daily-reminders/` |
| Hosting | Vercel, account `hekmawisdom`, project `web` | Deploys are currently **manual** (`vercel --prod`) — GitHub↔Vercel auto-deploy was attempted once and failed to connect; not retried |

## Prerequisites

- **Node.js 20 or newer** (20.20.x confirmed working; `package.json` doesn't pin an `engines` field but some sub-dependency wants ≥22 and prints a harmless `EBADENGINE` warning on install — ignore it if the app runs)
- **npm** — use npm, not bun. A `bun.lock` exists from the original Lovable scaffold but `package-lock.json` is the one that's actually kept up to date; installing with bun risks drifting from what's actually deployed.
- **git**
- A Supabase account with access to project `wydnzsgepqqdqibxgyea` (ask to be added as a collaborator, or use the owner's credentials)
- A Vercel account with access to the `hekmawisdom` team (for deploys)

## First-time setup

```bash
git clone https://github.com/HekmaWisdom/athar.git
cd athar
npm install
cp .env.example .env
# now fill in .env — see .env.example's comments for where each value comes from,
# and Quotes App/SETUP.md § "Environment variables" for the full walkthrough
npm run dev
```

Vite prints the local URL (usually `http://localhost:8080`, or the next free port if that's taken). Open it — you should land on the onboarding flow on first run, or the home feed if a Supabase session already exists in your browser.

## Everyday commands

| Command | Does |
|---|---|
| `npm run dev` | Local dev server (Vite, hot reload) |
| `npm run build` | Production build |
| `npm run build:dev` | Dev-mode build (unminified, for debugging a build issue) |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier, writes in place |

**No test suite exists.** Verify changes by running the app and clicking through the affected flow.

## Project structure

```
src/
├── routes/            # file-based routing (TanStack Start) — see routes/README.md
│   ├── __root.tsx      # app shell, wraps every page
│   ├── index.tsx        # home / daily quote feed
│   ├── discover.tsx      # category + author browse, search
│   ├── journal.tsx        # journal (client-side E2E encrypted, see below)
│   ├── profile.tsx         # settings, push notification reminders
│   ├── onboarding.tsx       # interests / reminder time / mood — gates `/` until profiles.onboarded
│   ├── auth.tsx              # sign in / sign up / guest
│   └── admin.tsx              # quote/author/category CRUD, gated by user_roles
├── lib/
│   ├── quotes.ts       # all Supabase queries for quotes/categories/authors/favorites
│   ├── auth-context.tsx # React context wrapping Supabase auth state
│   ├── journal-crypto.ts # AES-256-GCM client-side encryption for journal entries
│   ├── push.ts          # web push subscribe/unsubscribe
│   ├── i18n.tsx           # ar/en strings
│   └── share-card.ts       # canvas renderer for the shareable quote images
├── integrations/supabase/  # generated client + types (client.ts is client-side, client.server.ts is SSR)
└── components/         # ExplainSheet, QuoteCard, AppShell + shadcn primitives in ui/

supabase/
├── config.toml         # CLI project link (should read wydnzsgepqqdqibxgyea)
├── migrations/         # applied in order — see caveat below
└── functions/send-daily-reminders/  # the push notification cron job
```

## Things that will surprise you (read before you spend an hour debugging)

1. **Journal encryption is real, and unrecoverable by design.** `journal_entries` stores `ciphertext`/`iv` only — the encryption key is derived client-side from a user passphrase (`journal-crypto.ts`, PBKDF2 250k iterations) and never leaves the browser except as a `sessionStorage`-cached derived key. If a user forgets their journal passphrase, those entries are gone. This is intentional (real E2E), not a bug to "fix" by adding a reset path that stores the key server-side.

2. **Push notifications require HTTPS.** `localhost` counts as a secure context, but testing from your phone over your LAN IP (`http://192.168.x.x:8080`) does not — the browser silently refuses to register the service worker. To test on a real device, deploy to Vercel (`vercel` for a preview, `vercel --prod` for production) and test against that URL instead.

3. **The dev server dies quietly.** Running in the background (e.g., left overnight, laptop sleeps) it has died silently and repeatedly across past sessions — not a code bug, just restart `npm run dev` if `localhost:8080` stops responding.

4. **`supabase/migrations/*.sql` is a history log, not a guaranteed source of truth.** Several migrations (notably the push-notification and journal-encryption ones) were applied by pasting SQL directly into the Supabase SQL Editor rather than via `supabase db push`, because that's what worked in-session at the time. Before assuming the live DB schema matches what's in `migrations/`, check `src/integrations/supabase/types.ts` (generated from the live schema — regenerate with `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`) or query the DB directly.

5. **This is still a Lovable-connected repo at the git level**, even though development happens directly now (see `AGENTS.md` in this folder). Avoid force-pushing or rewriting published history on `main` — it syncs back into Lovable's editor and could confuse anything still pointed at it there.

6. **There is deliberately no live AI.** "Reflect deeply" (`ExplainSheet.tsx`) shows only the hand-curated fields on the `quotes` row (`explanation_ar/en`, `modern_context_ar/en`, `action_step_ar/en`, `journal_prompt_ar/en`). A quote added via `/admin` without those fields shows a "reflection coming soon" message. The old Lovable AI-gateway call was removed 2026-09-19 to keep the app at zero API cost — recover `ai.functions.ts` from git history if you ever want it back.

## Deploying

```bash
npm run build   # optional local sanity check first
vercel --prod   # from this directory; requires `vercel login` once per machine
```

Environment variables live in the Vercel project settings (Project → Settings → Environment Variables), already set for production. If you're setting up a *new* Vercel project (rather than deploying to the existing one), copy every var from `.env` into Vercel's dashboard — see `Quotes App/SETUP.md` for the full list and what each one is for.

## Supabase CLI

```bash
npx supabase login              # opens a browser, or use an access token from
                                 # supabase.com/dashboard/account/tokens
npx supabase link --project-ref wydnzsgepqqdqibxgyea
npx supabase functions deploy send-daily-reminders
```

The Edge Function needs its own secrets set separately from the app's `.env` — see the comment block at the top of `supabase/functions/send-daily-reminders/index.ts`.

## Where to go next

- Full onboarding + accounts checklist for a brand-new machine: [`../../SETUP.md`](../../SETUP.md)
- Current status, what's shipped, what's open: [`../../documentation/ROADMAP.md`](../../documentation/ROADMAP.md)
- Design tokens, RTL rules, core flows: [`../../documentation/DESIGN-SYSTEM.md`](../../documentation/DESIGN-SYSTEM.md)
- Route conventions: [`src/routes/README.md`](src/routes/README.md)
