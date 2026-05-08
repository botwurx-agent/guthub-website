@AGENTS.md

# GuthubAI — Full-stack app + marketing site

AI-powered gut health companion. Marketing site + full app stack (auth, onboarding, dashboard, logging, AI coach, meal planner, insights, Stripe billing).

- **Live**: https://guthub-website.vercel.app/
- **Repo**: https://github.com/botwurx-agent/guthub-website
- **Deploy**: Vercel auto-deploys every push to `main` on GitHub (~90s build time)
- **Active branch**: `claude/continue-guthub-backend-QiJwE` — all app work lives here AND is fast-forwarded to `main` so it deploys live. Always push both:
  1. `git push https://github.com/botwurx-agent/guthub-website.git main:claude/continue-guthub-backend-QiJwE`
  2. `git push https://github.com/botwurx-agent/guthub-website.git main:main` (triggers Vercel deploy)
- **Design source**: `Guthub_app_design_handoff/app/components/` — JSX mockups for every app screen. `project/spec.md` — full product spec v2.1. `project/README.md` — design tokens.

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
NEXT_PUBLIC_APP_URL=https://guthub-website.vercel.app  ← already set in Vercel
```
All env vars are set in Vercel. Supabase redirect URL `https://guthub-website.vercel.app/auth/callback` is configured.

## Auth approach (IMPORTANT)
**All auth uses the browser Supabase client (`lib/supabase/client.ts`), NOT server actions.**
- `components/AuthModal.tsx` — signup, signin, password reset, Google OAuth all use `createClient()` browser client directly
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`
- After email auth: `window.location.href = '/dashboard'`
- Server actions in `app/actions/auth.ts` exist but are NOT used by AuthModal — they were unreliable

## Supabase migrations (all run in production)
- `supabase/migrations/001_initial_schema.sql` — 18 tables, RLS, storage buckets, triggers
- `supabase/migrations/002_stripe_helpers.sql` — `increment_founding_counter()` RPC
- `supabase/migrations/005_beverage_meal_type.sql` — adds `beverage` to `meal_logs_meal_type_check` constraint

## Routes / pages

### Marketing (public)
- `/` — `app/page.tsx` → `components/home/*` (Hero, ProblemSection, FeaturesSection, HowItWorks, Testimonials, Pricing, FAQ) + `FinalCTA`
- `/features` — `app/features/page.tsx` → `components/features/*`
- `/pricing` — `app/pricing/page.tsx` → `components/pricing/PricingContent.tsx` (3-tier Stripe checkout)
- `/about` — `app/about/page.tsx` → `components/about/*`
- Shared chrome: `components/Header.tsx`, `Footer.tsx`, `AuthModal.tsx`, `FinalCTA.tsx`

### App (auth + subscription gated via `middleware.ts`)
- `/onboarding` — `app/onboarding/page.tsx` — 6-step wizard, chip-based selectors, AI macro calculation
- `/dashboard` — `app/dashboard/page.tsx` — gut score ring, macros, weight, water
- `/log` — `app/log/` — tabbed logging: meal, symptom, BM, water, weight, note
- `/coach` — `app/coach/` — SSE streaming AI chat with image upload
- `/meal-planner` — `app/meal-planner/` — AI weekly meal grid, generate/swap/accept
- `/insights` — `app/insights/` — 30-day charts, symptom frequency, food-symptom correlations
- `/settings` — billing portal (Stripe Customer Portal)
- Shared app chrome: `components/app/AppShell.tsx` (forest sidebar + sticky topbar)

### API routes
- `app/api/stripe/checkout/route.ts` — creates Checkout Session (7-day trial)
- `app/api/stripe/webhook/route.ts` — syncs subscription status to Supabase
- `app/api/stripe/portal/route.ts` — Stripe Customer Portal redirect
- `app/api/coach/stream/route.ts` — SSE streaming OpenAI chat
- `app/api/meal-planner/generate/route.ts` — AI meal generation (full week or single slot)
- `app/api/insights/analyze/route.ts` — AI food-symptom correlation analysis
- `app/auth/callback/route.ts` — Google OAuth callback

### Server actions
- `app/actions/auth.ts` — signUp, signIn, signOut, signInWithGoogle, resetPassword (NOT used by AuthModal)
- `app/actions/onboarding.ts` — saveProfileStep, completeOnboarding (AI macro calc) — USED by onboarding page
- `app/actions/log.ts` — logWater, logWeight, logSymptom, logBM, logNote, logMeal. All use `localDate(formData)` helper — reads client-sent `log_date` field (YYYY-MM-DD) so timezone is always the user's local date, not UTC.
- `app/actions/coach.ts` — getOrCreateThread, getThreadMessages, startNewThread, getThreadList, **renameThread**, **deleteThread**, **savePlanFromCoach** (check/replace/skip modes for conflict-safe meal plan saves)

### Key libs
- `lib/ai-config.ts` — AI_MODEL, AI_MODEL_VISION, TEMP constants
- `lib/stripe.ts` — Stripe client + PLANS config (API version: `2026-04-22.dahlia`)
- `lib/gut-score.ts` — computeGutScore(), gutScoreLabel()
- `lib/coach-context.ts` — comprehensive AI context builder: all intake fields (nickname, eating_style, allergens, primary_goals, sleep_quality, energy_level, ed_history, etc.), water logs, note_logs, meal_plan_slots, symptom logs with onset_minutes
- `lib/supabase/server.ts` — createClient(), createServiceClient()
- `lib/supabase/client.ts` — browser createClient()
- `lib/timezone.ts` — getUserTimezone(), todayInTz(), daysAgoInTz(), formatTimeInTz()
- `components/app/ClientTime.tsx` — `'use client'` component that renders ISO timestamp in user's local timezone

## Primitives: `components/ui.tsx` exports `Button`, `Badge`, `Eyebrow`, `Reveal`

## Design handoff files (in `Guthub_app_design_handoff/app/`)
Reference these when building/rebuilding app screens:
- `components/AppShell.jsx` — sidebar + topbar layout (DONE — `components/app/AppShell.tsx`)
- `components/Onboarding.jsx` — 6-step intake form with ChipGroup pattern (DONE — `app/onboarding/page.tsx`)
- `components/PageToday.jsx` — Dashboard mockup (TODO)
- `components/PageLog.jsx` — Log mockup (TODO)
- `components/PageCoach.jsx` — Coach mockup (TODO)
- `components/PagePlan.jsx` — Meal planner mockup (TODO)
- `components/PageInsights.jsx` — Insights mockup (TODO)
- `app/app.css` — all component CSS classes used in mockups
- `app/components/Icon.jsx` — custom SVG icons (we use lucide-react instead)

## What's been built and confirmed working (as of 2026-05-08)

### ✅ Completed & live
- **Marketing site** — full homepage, features, pricing, about pages
- **Auth** — Google OAuth + email/password signup/signin via browser Supabase client
- **AppShell** — 248px forest sidebar, sticky topbar, logo-dark.png, terracotta active states, gradient avatar with user initials, "Restart onboarding" pill button
- **Onboarding** — 6-step form with forest sidebar, chip selectors throughout:
  - Step 1: name, DOB, gender, nickname (inputs)
  - Step 2: weight/height inputs + **chip multi-select** for medical conditions (IBS, IBD/Crohn's, GERD, etc.) + allergens (Dairy, Gluten, etc.) + medications textarea
  - Step 3: **eating style chips** (12 options) + cooking/eat-out frequency selects + typical day textarea
  - Step 4: **goals chips** (8 options, multi-select max 3) + activity level chips + specific concerns + prior RD chips
  - Step 5: **sleep quality chips** (Great/Pretty good/So-so/Poorly) + energy level chips + stress 1-10 slider + notes
  - Step 6: finish/confirm + AI macro calculation on submit
- **Dashboard** — gut score ring, macro progress bars, weight, water tracking. Timestamps rendered via `<ClientTime>` (user's local TZ).
- **Log** — tabbed: meal (+ Beverage chip), symptom, BM, water, weight, note. All log forms send `log_date` client-side so UTC server clock never determines the date.
- **Coach** — SSE streaming AI chat with image upload:
  - Thread sidebar with **inline rename** (pencil icon) and **delete** (trash icon)
  - **Personalized welcome message** built from intake profile (conditions, goals, eating style)
  - **Full intake context** passed to AI (all profile fields, water/notes/meal plan history)
  - **Empathetic/comforting tone** tuned in system prompt
  - **App page links** — coach can reference Today/Log/Plan/Insights/Settings using `[label](/path)` markdown; rendered as terracotta anchors
  - **Save to Planner card** — when coach drafts a meal plan, a save card appears with `← Tomorrow →` start date picker (offset 0–30 days), conflict detection, and Replace / Add to empty slots only options
  - **Auto-title** — after first exchange, AI generates a 4–7 word thread title automatically
- **Meal Planner** — AI 7-day week grid, generate/swap/accept slots
- **Insights** — SVG line charts for gut score + weight trends, symptom frequency, food-symptom correlations, AI analysis
- **Stripe** — 3-tier checkout with 7-day trial, webhook, customer portal

### Known gotchas & important fixes applied
- **gpt-5-mini does NOT support `max_tokens`** — removed from `app/api/coach/stream/route.ts`
- **Timezone for log dates**: `new Date()` on Vercel server = UTC. Fix: all log forms set `log_date` via `new Date().toLocaleDateString('en-CA')` client-side; server action reads it with `localDate(formData)` helper.
- **Timezone for display labels**: "Today" / "Yesterday" computed in `LogPageClient.tsx` using `const _yd = new Date(); _yd.setDate(_yd.getDate() - 1)` — NOT `Date.now() - 86400000` (DST-unsafe).
- **`x-vercel-ip-timezone` header** is only reliable at Edge runtime, not serverless functions. Used only for DB query range in `app/log/page.tsx` and `app/dashboard/page.tsx`; never for display labels.
- **Beverage meal type**: DB constraint updated via `supabase/migrations/005_beverage_meal_type.sql`. Chip row uses `flexWrap: 'wrap'` to prevent overflow.
- **Coach context** was reading wrong field names (`primary_goal` → `primary_goals`, `allergies` → `allergens`). Fixed in `lib/coach-context.ts`.
- **`savePlanFromCoach` orphaned code**: old `const { error }` block removed after rewrite.

### ✅ All app pages rebuilt to match design handoff
All pages have been rebuilt to match the JSX mockups in `Guthub_app_design_handoff/`:
1. Today (Dashboard) — `app/dashboard/page.tsx` ✅
2. Log — `app/log/` ✅
3. Coach — `app/coach/` ✅
4. Meal Planner — `app/meal-planner/` ✅
5. Insights — `app/insights/` ✅

**Current phase: testing pages and features, fixing bugs.**

## AppShell details (`components/app/AppShell.tsx`)
- 248px forest-500 sidebar, sticky, full viewport height
- Logo: `/logo-dark.png` (140px wide, 36px tall)
- Tagline: "AI Health Assistant" (small caps, muted cream)
- Nav items: Today(/dashboard), Log(/log), Plan(/meal-planner), Insights(/insights), Coach(/coach) with "AI" badge
- Active state: `terracotta-400` background, white text
- Footer: "Restart onboarding" pill button (resets `onboarding_completed=false`, routes to /onboarding) + Community, Settings, Need help?
- Topbar: 64px sticky, search input (hidden mobile), Quick log pill link, bell with notification dot, gradient avatar (coral→yellow) showing user initials from Supabase auth metadata

## Onboarding chip pattern (reusable `ChipGroup` component in `app/onboarding/page.tsx`)
```tsx
<ChipGroup
  options={['Option A', 'Option B', 'Option C']}
  value={selected}          // string[]
  onChange={setSelected}    // (v: string[]) => void
  multi={true}              // false = single select
/>
```
Chips show a checkmark when selected, terracotta border + light terracotta bg.

## Design tokens (in `app/globals.css`)
Cream / forest / terracotta palette: `--cream-50/100/200`, `--forest-300/400/500/600`, `--terracotta-300/400/500/600`, `--ink-100..900`. Section backgrounds typically alternate `--cream-50` ↔ `--cream-100` ↔ `--terracotta-50` ↔ `--forest-500` (dark).

## Common workflow
1. **Start dev server first**: `npm run dev` from the repo root (background it, wait for "Ready"). It dies between sessions. Repo path: `/home/user/guthub-website`.
2. **Make edits** with Edit/Write tools.
3. **Verify visually**: write a Playwright script to `/tmp/`, screenshot the page, Read the PNG. The user can't preview localhost — screenshots are the confirmation method.
   - To screenshot a specific step/state that requires navigation: temporarily patch `useState(0)` to `useState(N)`, screenshot, restore original.
4. **Commit + push** when user approves. PAT is in `~/.netrc` — if it's missing or 401s, ask user for a fresh PAT (classic, `repo` scope).

## Push protocol (important — don't use `git push origin`)

The sandbox `origin` remote is a read-only local HTTP proxy — `git push origin` 403s. Always push directly to github.com via `~/.netrc`.

```bash
# Push to feature branch
git push https://github.com/botwurx-agent/guthub-website.git main:claude/continue-guthub-backend-QiJwE 2>&1 | tail -5

# Push to main to trigger Vercel deploy (ask user first — it's public-facing)
git push https://github.com/botwurx-agent/guthub-website.git main:main 2>&1 | tail -5

# Sync local tracking refs (clears the stop hook warning)
git fetch origin
git branch --set-upstream-to=origin/claude/continue-guthub-backend-QiJwE main
```

`~/.netrc` format (chmod 600):
```
machine github.com
login x-access-token
password ghp_XXXXXXXXXXXX
```

## Sandbox quirks
- No outbound access to tunnels (cloudflared, ngrok), Vercel, Netlify — they 403 with "Host not in allowlist". GitHub, npm, Google Fonts work.
- `vercel.app` is blocked — can't screenshot live deploy, only localhost dev server.
- `playwright` requires `ignoreHTTPSErrors: true` for any HTTPS site.
- Git commit signing is broken; `git config commit.gpgsign false` is set in repo.
- The `~/.netrc` PAT does NOT persist between sessions — ask user for it at session start if `git push` returns 401.

## Conventions
- All interactive/animated components need `'use client'` at the top.
- Animations: CSS keyframes defined in `globals.css` (bubbleIn, typing, barGrow, pulse, scanMove, popIn, slideUp, heroGlow, authFadeIn, authPopIn) — reference by name in component styles.
- Auth modal: any component can call `openAuth('signup' | 'signin')` from `components/AuthModal.tsx`. It dispatches a `CustomEvent('open-auth')` that the modal listens for.
- Grid layouts that need stable widths: use `minmax(0, 1fr)` instead of bare `1fr`.
- Cards in a grid that should match heights: stretch the `Reveal` wrapper (`style={{ height: '100%' }}`) AND the card itself.
- Don't add Tailwind, CSS modules, or styled-components — match the existing inline-style + CSS-var pattern.
- Stripe API version must be `'2026-04-22.dahlia'` in `lib/stripe.ts` — any other version causes TypeScript build failure on Vercel.
