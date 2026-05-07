@AGENTS.md

# GuthubAI — Full-stack app + marketing site

AI-powered gut health companion. Marketing site + full app stack (auth, onboarding, dashboard, logging, AI coach, meal planner, insights, Stripe billing).

- **Live**: https://guthub-website.vercel.app/
- **Repo**: https://github.com/botwurx-agent/guthub-website
- **Deploy**: Vercel auto-deploys every push to `main`
- **Active branch**: `claude/continue-guthub-backend-QiJwE` — ALL app work is here, not yet merged to main
- **Design source**: `project/README.md` (design tokens, type, component spec) and `project/preview/*.html` (rendered references)

## Stack
- Next.js 16 App Router (Turbopack) — read `node_modules/next/dist/docs/` before assuming APIs
- React 19, TypeScript
- Supabase (Postgres + Auth + Storage) — project: `wgqgslpuyrvaffncxbtr.supabase.co`
- OpenAI SDK — model: `gpt-5-mini-2025-08-07` — centralized in `lib/ai-config.ts`
- Stripe — LIVE mode keys — 3 price tiers (founding/launch/standard)
- Resend — transactional email
- Inline styles using CSS custom properties (no Tailwind, no CSS-in-JS lib)
- `next/font/google` for Source Serif 4 (display) + Inter (body) — `var(--font-display)` / `var(--font-body)`
- `lucide-react` for icons
- Playwright (system-wide at `/opt/node22/lib/node_modules/playwright`) for screenshot verification

## Environment variables (in `.env.local` — never committed)
```
NEXT_PUBLIC_SUPABASE_URL=https://wgqgslpuyrvaffncxbtr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...MTqLM6piujKVQdciH5eJh2pr0r4z2qJORMr1L4tjC4c
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...ylPhVAbfcSoYflQTpwYpHNH59xz4Ku-a6qGjskh0MJo
OPENAI_API_KEY=sk-proj-vF6gL6GXJXGaBncybuIj0ElUe2w8-...
RESEND_API_KEY=re_JLs8SizR_DfytKt9omb2396UiRUNehYqL
STRIPE_SECRET_KEY=rk_live_51Sg9DxLIYtcFkVB9... (restricted key)
STRIPE_WEBHOOK_SECRET=whsec_32xmQHbTM5mqhf9nyPlnlSs4AFp9NAub
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Sg9DxLIYtcFkVB9...
STRIPE_PRICE_FOUNDING=price_1TUIN9LIYtcFkVB96mV9TuSZ
STRIPE_PRICE_LAUNCH=price_1TUIOcLIYtcFkVB9zg37aci4
STRIPE_PRICE_STANDARD=price_1TUIR8LIYtcFkVB9HOacNqHz
NEXT_PUBLIC_APP_URL=http://localhost:3000  ← change to https://guthub-website.vercel.app for prod
```

## Supabase migrations (both already run in production)
- `supabase/migrations/001_initial_schema.sql` — 18 tables, RLS, storage buckets, triggers
- `supabase/migrations/002_stripe_helpers.sql` — `increment_founding_counter()` RPC

## Routes / pages

### Marketing (public)
- `/` — `app/page.tsx` → `components/home/*` (Hero, ProblemSection, FeaturesSection, HowItWorks, Testimonials, Pricing, FAQ) + `FinalCTA`
- `/features` — `app/features/page.tsx` → `components/features/*`
- `/pricing` — `app/pricing/page.tsx` → `components/pricing/PricingContent.tsx` (3-tier Stripe checkout)
- `/about` — `app/about/page.tsx` → `components/about/*`
- Shared chrome: `components/Header.tsx`, `Footer.tsx`, `AuthModal.tsx`, `FinalCTA.tsx`

### App (auth + subscription gated via `middleware.ts`)
- `/onboarding` — `app/onboarding/page.tsx` — 6-step wizard, AI macro calculation
- `/dashboard` — `app/dashboard/page.tsx` — gut score ring, macros, weight, water
- `/log` — `app/log/` — tabbed logging: meal, symptom, BM, water, weight, note
- `/coach` — `app/coach/` — SSE streaming AI chat with image upload
- `/meal-planner` — `app/meal-planner/` — AI weekly meal grid, generate/swap/accept
- `/insights` — `app/insights/` — 30-day charts, symptom frequency, food-symptom correlations
- `/settings` — billing portal (Stripe Customer Portal)
- Shared app chrome: `components/app/AppShell.tsx` (forest sidebar + mobile bottom nav)

### API routes
- `app/api/stripe/checkout/route.ts` — creates Checkout Session (7-day trial)
- `app/api/stripe/webhook/route.ts` — syncs subscription status to Supabase
- `app/api/stripe/portal/route.ts` — Stripe Customer Portal redirect
- `app/api/coach/stream/route.ts` — SSE streaming OpenAI chat
- `app/api/meal-planner/generate/route.ts` — AI meal generation (full week or single slot)
- `app/api/insights/analyze/route.ts` — AI food-symptom correlation analysis
- `app/auth/callback/route.ts` — Google OAuth callback

### Server actions
- `app/actions/auth.ts` — signUp, signIn, signOut, signInWithGoogle, resetPassword
- `app/actions/onboarding.ts` — saveProfileStep, completeOnboarding (AI macro calc)
- `app/actions/log.ts` — logWater, logWeight, logSymptom, logBM, logNote, logMeal
- `app/actions/coach.ts` — getOrCreateThread, getThreadMessages, startNewThread, getThreadList

### Key libs
- `lib/ai-config.ts` — AI_MODEL, AI_MODEL_VISION, TEMP constants
- `lib/stripe.ts` — Stripe client + PLANS config
- `lib/gut-score.ts` — computeGutScore(), gutScoreLabel()
- `lib/coach-context.ts` — 4-layer AI context builder
- `lib/supabase/server.ts` — createClient(), createServiceClient()
- `lib/supabase/client.ts` — browser createClient()

## Primitives: `components/ui.tsx` exports `Button`, `Badge`, `Eyebrow`, `Reveal`

## Pending deployment steps (in progress when session ended)
1. Add all env vars to Vercel → Settings → Environment Variables (user was doing this)
2. Add `https://guthub-website.vercel.app/auth/callback` to Supabase Auth → URL Configuration → Redirect URLs
3. Update `NEXT_PUBLIC_APP_URL` in Vercel to `https://guthub-website.vercel.app`
4. Fast-forward main: `git checkout main && git merge --ff-only claude/continue-guthub-backend-QiJwE`
5. Push main to trigger Vercel auto-deploy
6. Verify live site at https://guthub-website.vercel.app

## Design tokens (in `app/globals.css`)
Cream / forest / terracotta palette: `--cream-50/100/200`, `--forest-300/400/500/600`, `--terracotta-300/400/500/600`, `--ink-100..900`. Section backgrounds typically alternate `--cream-50` ↔ `--cream-100` ↔ `--terracotta-50` ↔ `--forest-500` (dark).

## Common workflow
1. **Start dev server first**: `npm run dev` from the repo root (background it, wait for "Ready"). It dies between sessions. The repo path varies per session — use whatever the CWD is (e.g. `/home/user/guthub-website` or `/home/claude/repo`).
2. **Make edits** with Edit/Write tools.
3. **Verify visually**: write a small playwright script to `/tmp/`, screenshot the page or a specific section, Read the PNG. The user can't preview localhost — screenshots are how they confirm.
4. **Commit + push** when the user approves. Push needs a fresh PAT from the user (classic, `repo` scope) — they reuse it across sessions and rotate themselves.

## Push protocol (important — don't use `git push origin`)

The sandbox's `origin` remote is a local HTTP proxy (`http://local_proxy@127.0.0.1:40429/...`) that is **read-only** for this identity — `git push origin` 403s, and MCP GitHub write tools also 403. Fetches work fine. Always push directly to `github.com` with the inline-PAT pattern below, and sync tracking refs afterward.

**1. Push directly to github.com with inline PAT:**
```
git -c "http.https://github.com/.extraheader=Authorization: Basic $(printf 'x-access-token:%s' <PAT> | base64 -w0)" push https://github.com/botwurx-agent/guthub-website.git <localBranch>:<remoteBranch> 2>&1 | sed 's/ghp_[A-Za-z0-9]*/ghp_***/g' | tail -5
```
Always pipe through `sed 's/ghp_[A-Za-z0-9]*/ghp_***/g'` to keep the token out of logs.

**2. Sync local tracking refs so the stop hook clears:**
```
git fetch origin
# For feature branches on first push, also: git branch --set-upstream-to=origin/<branch> <branch>
```
The proxy's fetch sees the new SHA on github.com and updates `origin/<branch>`. Without this, `git status` still says "unpushed" and the `~/.claude/stop-hook-git-check.sh` hook keeps firing.

**Deploy flow:**
- Vercel auto-deploys every push to `main` — live URL refreshes in ~90s.
- Feature branches (e.g. `claude/start-dev-server-htVZW`) get no auto-preview from inside the sandbox (`vercel.app` is blocked). To show the user the live changes, fast-forward main onto the feature branch and push main: `git checkout main && git merge --ff-only <branch>` then push `main:main`.
- Ask before pushing to main — it's public-facing. A user saying "push it live" or "show me on vercel.app" is explicit permission.

## Sandbox quirks
- No outbound access to tunnels (cloudflared, ngrok), Vercel, Netlify, etc. — they 403 with "Host not in allowlist". GitHub, npm, and Google Fonts work.
- `vercel.app` is also blocked, so I can't screenshot the live deploy from inside the sandbox — only the local dev server.
- `playwright` requires `ignoreHTTPSErrors: true` for any HTTPS site I do hit.
- Git commit signing is broken; `git config commit.gpgsign false` is set in repo.

## Conventions
- All interactive/animated components need `'use client'` at the top.
- Animations: CSS keyframes defined in `globals.css` (bubbleIn, typing, barGrow, pulse, scanMove, popIn, slideUp, heroGlow, authFadeIn, authPopIn) — reference by name in component styles.
- Auth modal: any component can call `openAuth('signup' | 'signin')` from `components/AuthModal.tsx`. It dispatches a `CustomEvent('open-auth')` that the modal listens for.
- Grid layouts that need stable widths regardless of content: use `minmax(0, 1fr)` instead of bare `1fr`.
- Cards in a grid that should match heights: stretch the `Reveal` wrapper (`style={{ height: '100%' }}`) AND the card itself.
- Don't add Tailwind, CSS modules, or styled-components — match the existing inline-style + CSS-var pattern.
