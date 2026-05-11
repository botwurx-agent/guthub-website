@AGENTS.md

# GuthubAI — Full-stack app + marketing site

AI-powered gut health companion. Marketing site + full app stack (auth, onboarding, dashboard, logging, AI coach, meal planner, insights, Stripe billing).

- **Live**: https://app.guthub.ai/ (custom domain) + https://guthub-website.vercel.app/
- **Repo**: https://github.com/botwurx-agent/guthub-website
- **Deploy**: Vercel auto-deploys every push to `main` on GitHub (~90s build time)
- **Active branch**: `claude/continue-guthub-development-o0zfs` — all work lives here AND is pushed to `main` so it deploys live. Always push both:
  1. `git push https://github.com/botwurx-agent/guthub-website.git claude/continue-guthub-development-o0zfs:claude/continue-guthub-development-o0zfs`
  2. `git push https://github.com/botwurx-agent/guthub-website.git claude/continue-guthub-development-o0zfs:main` (triggers Vercel deploy)
- **Design source**: `Guthub_app_design_handoff/app/components/` — JSX mockups for every app screen. `project/spec.md` — full product spec v2.1. `project/README.md` — design tokens.

## Stack
- Next.js 16 App Router (Turbopack) — read `node_modules/next/dist/docs/` before assuming APIs
- React 19, TypeScript
- Supabase (Postgres + Auth + Storage) — project: `wgqgslpuyrvaffncxbtr.supabase.co`
- OpenAI SDK — model: `gpt-5-mini-2025-08-07` — centralized in `lib/ai-config.ts`
- Stripe — LIVE mode keys — restricted key `rk_live_...` — 3 price tiers (founding/launch/standard)
- Resend — transactional email from `hello@guthub.ai` (domain verified)
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
STRIPE_SECRET_KEY=rk_live_51Sg9DxLIYtcFkVB9... (restricted key — needs: Customers, SetupIntents, Subscriptions, PaymentMethods, BillingPortal write)
STRIPE_WEBHOOK_SECRET=whsec_32xmQHbTM5mqhf9nyPlnlSs4AFp9NAub
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51Sg9DxLIYtcFkVB9...
STRIPE_PRICE_FOUNDING=price_1TUIN9LIYtcFkVB96mV9TuSZ
STRIPE_PRICE_LAUNCH=price_1TUIOcLIYtcFkVB9zg37aci4
STRIPE_PRICE_STANDARD=price_1TUIR8LIYtcFkVB9HOacNqHz
NEXT_PUBLIC_APP_URL=https://guthub-website.vercel.app  ← set in Vercel; custom domain app.guthub.ai also works
```
All env vars are set in Vercel. Supabase redirect URLs configured for both `guthub-website.vercel.app` and `app.guthub.ai`.

## Auth approach (IMPORTANT)
**All auth uses the browser Supabase client (`lib/supabase/client.ts`), NOT server actions.**
- `components/AuthModal.tsx` — signup, signin, password reset, Google OAuth all use `createClient()` browser client directly
- AuthModal auto-opens when `?auth=signin` is in the URL (e.g. redirected from `/subscribe` when unauthenticated)
- After email signin, respects `?return=/path` query param — redirects there instead of dashboard
- Google OAuth: callback URL receives `?next=/path` to preserve return URL through OAuth flow
- After signup → redirects to `/onboarding` (preserving `?return=` if present)
- After signin → checks `onboarding_completed`, redirects to dashboard or onboarding
- Server actions in `app/actions/auth.ts` exist but are NOT used by AuthModal

## Trial & subscription flow (IMPORTANT — Option B)
**Card required to start trial.** Flow:
1. Any CTA ("Start free trial") → `/pricing` (pick plan)
2. `/pricing` plan card → `/subscribe?plan=X`
3. `/subscribe` (unauthenticated) → redirect to `/?auth=signin&return=/subscribe?plan=X` → AuthModal auto-opens
4. `/subscribe` (authenticated) → Stripe SetupIntent created server-side → payment form rendered
5. Card entered → `confirmSetup()` → POST `/api/stripe/create-subscription` → subscription created with `trial_period_days: 7`
6. New users (no onboarding) → redirect to `/onboarding`; existing users → `/dashboard?checkout=success`
7. Webhook `customer.subscription.created` → sets `subscription_status = 'trialing'`, `trial_ends_at` from Stripe's `trial_end`
8. `completeOnboarding` only sets `trial_ends_at` if not already set by Stripe

**Trial emails (all from `hello@guthub.ai` via Resend):**
- **Welcome** — fires in `completeOnboarding` after onboarding step 6
- **Day 5 reminder** — fires on dashboard load when `daysLeft <= 2 && !trial_email_sent`; sets `trial_email_sent = true`
- **Trial expired** — fires on `/pricing?reason=subscription_required` when `trialEnded && !trial_expired_email_sent`; sets `trial_expired_email_sent = true`
- **Conversion confirmation** — fires in webhook on `checkout.session.completed`

## Supabase migrations (all run in production)
- `supabase/migrations/001_initial_schema.sql` — 18 tables, RLS, storage buckets, triggers
- `supabase/migrations/002_stripe_helpers.sql` — `increment_founding_counter()` RPC
- `supabase/migrations/005_beverage_meal_type.sql` — adds `beverage` to `meal_logs_meal_type_check` constraint
- **Applied via MCP (no file)**: `trial_expired_email_sent boolean default false` column on `profiles`
- **Applied via MCP (no file)**: `handle_new_user()` trigger no longer sets `trial_ends_at` — it stays NULL until card collected

## Routes / pages

### Marketing (public)
- `/` — `app/page.tsx` → `components/home/*` (Hero, ProblemSection, FeaturesSection, HowItWorks, Testimonials, Pricing, FAQ) + `FinalCTA`
- `/features` — `app/features/page.tsx` → `components/features/*`
- `/pricing` — `app/pricing/page.tsx` → `components/pricing/PricingContent.tsx` (3-tier plan picker → /subscribe)
- `/about` — `app/about/page.tsx` → `components/about/*`
- `/subscribe` — `app/subscribe/page.tsx` + `app/subscribe/SubscribeClient.tsx` — custom Stripe Elements checkout (SetupIntent flow)
- Shared chrome: `components/Header.tsx`, `Footer.tsx`, `AuthModal.tsx`, `FinalCTA.tsx`

**All marketing CTAs** ("Start free trial" in Hero, Header, FinalCTA, home Pricing section) → `/pricing`. They do NOT open the auth modal directly.

### App (auth + subscription gated via `middleware.ts`)
- `/onboarding` — `app/onboarding/page.tsx` — 6-step wizard, chip-based selectors, AI macro calculation
- `/dashboard` — `app/dashboard/page.tsx` — gut score ring, macros, weight, water, Coach Proactive tile
- `/log` — `app/log/` — tabbed logging: meal, symptom, BM, water, weight, note
- `/coach` — `app/coach/` — SSE streaming AI chat with image upload
- `/meal-planner` — `app/meal-planner/` — AI weekly meal grid, generate/swap/accept
- `/insights` — `app/insights/` — 30-day charts, symptom frequency, food-symptom correlations
- `/settings` — `app/settings/` — multi-tab settings panel (see below)
- Shared app chrome: `components/app/AppShell.tsx` (forest sidebar + sticky topbar)

### API routes
- `app/api/stripe/checkout/route.ts` — legacy Checkout Session (no longer used for new signups)
- `app/api/stripe/create-subscription/route.ts` — creates subscription server-side after SetupIntent; returns `needsOnboarding` flag
- `app/api/stripe/webhook/route.ts` — handles `customer.subscription.created` (sets trial_ends_at), `checkout.session.completed` (conversion email), `customer.subscription.updated/deleted`
- `app/api/stripe/portal/route.ts` — Stripe Customer Portal redirect (requires `billing_portal` write on restricted key)
- `app/api/coach/stream/route.ts` — SSE streaming OpenAI chat
- `app/api/meal-planner/generate/route.ts` — AI meal generation (full week or single slot)
- `app/api/insights/analyze/route.ts` — AI food-symptom correlation analysis
- `app/auth/callback/route.ts` — Google OAuth callback; supports `?next=/path` for post-auth redirect

### Server actions
- `app/actions/auth.ts` — signUp, signIn, signOut, signInWithGoogle, resetPassword (NOT used by AuthModal)
- `app/actions/onboarding.ts` — saveProfileStep, completeOnboarding (AI macro calc, welcome email, sets trial_ends_at only if null) — USED by onboarding page
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
- `components/app/MealIllustration.tsx` — shared SVG illustrations for breakfast/lunch/dinner (server-compatible, used in dashboard + meal planner)

## Settings page (`app/settings/SettingsClient.tsx`)
Six tabs in left nav:
1. **Profile & health** — name, email, DOB, gender, height, weight, conditions, allergens, eating style
2. **Goals & macros** — daily calories, protein, goal weight, activity level; links to onboarding to recalculate
3. **Coach behavior** — toggles: proactive nudges, auto-update meal plan, weekly recap, share with doctor
4. **Subscription** — plan/status badge, trial end date, "Manage billing" button (→ Stripe Customer Portal), feature list
5. **Account & security** — email display, Google badge if OAuth user, change password form (re-auths with current password before updating)
6. **Privacy & data** — export data, delete account (two-step confirm), privacy/encryption notice

## Dashboard Coach Proactive tile (`app/dashboard/page.tsx`)
Multi-state nudge — picks the highest-priority scenario:
1. No meals logged → "Ready to track your first meal today?"
2. Meals + symptoms logged → "You logged X symptoms — let's find what triggered it" → `/coach?autostart=symptoms`
3. Water < 50% of 2,000ml goal (past morning) → "You've only had X of 8 cups" → `/log?tab=water`
4. Calories ≥ 90% of target → "You're close to your calorie target"
5. Protein < 50% of target (afternoon/evening) → "Your protein intake is low"
6. Streak ≥ 3 days → "X-day streak — you're building momentum" → `/insights`
7. Default (meals logged) → "X meals logged today — keep it up"

## Primitives: `components/ui.tsx` exports `Button`, `Badge`, `Eyebrow`, `Reveal`

## Design tokens (in `app/globals.css`)
Cream / forest / terracotta palette: `--cream-50/100/200`, `--forest-300/400/500/600`, `--terracotta-300/400/500/600`, `--ink-100..900`. Section backgrounds typically alternate `--cream-50` ↔ `--cream-100` ↔ `--terracotta-50` ↔ `--forest-500` (dark).

## What's been built and confirmed working (as of 2026-05-11)

### ✅ Completed & live
- **Marketing site** — full homepage, features, pricing, about pages
- **Auth** — Google OAuth + email/password signup/signin via browser Supabase client. AuthModal auto-opens from `?auth=signin` URL param and respects `?return=` for post-login redirect.
- **AppShell** — 248px forest sidebar, sticky topbar, logo-dark.png, terracotta active states, gradient avatar, "Restart onboarding" pill
- **Onboarding** — 6-step form with AI macro calculation; `completeOnboarding` sets `trial_ends_at` only if not already set by Stripe, sends welcome email
- **Dashboard** — gut score ring, macro progress bars, weight, water. Coach Proactive tile with 7 data-driven states. Tonight's Dinner tile with SVG illustration.
- **Log** — tabbed: meal (+ Beverage chip), symptom, BM, water, weight, note
- **Coach** — SSE streaming AI chat, image upload, thread rename/delete, auto-title, Save to Planner card
- **Meal Planner** — AI 7-day week grid, generate/swap/accept slots
- **Insights** — SVG charts, symptom frequency, food-symptom correlations, AI analysis
- **Subscribe page** (`/subscribe`) — custom Stripe Elements (SetupIntent → create-subscription), two-column layout, 7-day trial, redirects new users to onboarding
- **Transactional emails** — welcome, day-5 reminder, trial expired, conversion confirmation (all from `hello@guthub.ai`)
- **Settings** — 6-tab panel including Account & Security (password change with re-auth) and Subscription (Manage Billing → Stripe portal)
- **Middleware** — protects app routes, redirects unauthenticated to `/?auth=signin&return=URL`, redirects pre-onboarding users to `/onboarding`, blocks expired trials to `/pricing?reason=subscription_required`

### Known gotchas & important fixes
- **gpt-5-mini does NOT support `max_tokens`** — do not add it to `app/api/coach/stream/route.ts`
- **Timezone for log dates**: `new Date()` on Vercel server = UTC. All log forms set `log_date` client-side via `new Date().toLocaleDateString('en-CA')`; server action reads with `localDate(formData)` helper.
- **Stripe restricted key** (`rk_live_...`) must have write access for: Customers, SetupIntents, Subscriptions, PaymentMethods, BillingPortal. If any are missing → 500 on the relevant page.
- **Stripe API version** must be `'2026-04-22.dahlia'` in `lib/stripe.ts` — any other version causes TypeScript build failure on Vercel.
- **Beverage meal type**: DB constraint updated via migration 005. Chip row uses `flexWrap: 'wrap'`.
- **`git push origin` 403s** — origin is a read-only local proxy. Always push to `https://github.com/botwurx-agent/guthub-website.git` directly. After pushing, run `git fetch origin <branch> && git branch --set-upstream-to=origin/<branch> <branch>` to clear the stop-hook warning.
- **`~/.netrc` PAT does NOT persist between sessions** — ask user for a fresh PAT (classic, `repo` scope) if `git push` returns 401.

## AppShell details (`components/app/AppShell.tsx`)
- 248px forest-500 sidebar, sticky, full viewport height
- Logo: `/logo-dark.png` (140px wide, 36px tall)
- Tagline: "AI Health Assistant" (small caps, muted cream)
- Nav items: Today(/dashboard), Log(/log), Plan(/meal-planner), Insights(/insights), Coach(/coach) with "AI" badge
- Active state: `terracotta-400` background, white text
- Footer: "Restart onboarding" pill button + Community, Settings, Need help?
- Topbar: 64px sticky, search input (hidden mobile), Quick log pill link, bell with notification dot, gradient avatar (coral→yellow) showing user initials

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

## Common workflow
1. **Start dev server first**: `npm run dev` from the repo root (background it, wait for "Ready"). It dies between sessions. Repo path: `/home/user/guthub-website`.
2. **Make edits** with Edit/Write tools.
3. **Verify visually**: write a Playwright script to `/tmp/`, screenshot the page, Read the PNG. The user can't preview localhost — screenshots are the confirmation method.
4. **Commit + push** when user approves. PAT is in `~/.netrc` — if missing or 401s, ask user for a fresh PAT.

## Push protocol (important — don't use `git push origin`)

The sandbox `origin` remote is a read-only local HTTP proxy — `git push origin` 403s. Always push directly to github.com via `~/.netrc`.

```bash
# Push to feature branch + main (triggers Vercel deploy)
git push https://github.com/botwurx-agent/guthub-website.git claude/continue-guthub-development-o0zfs:claude/continue-guthub-development-o0zfs 2>&1 | tail -5
git push https://github.com/botwurx-agent/guthub-website.git claude/continue-guthub-development-o0zfs:main 2>&1 | tail -5

# Sync local tracking refs (clears the stop hook warning — run after every push)
git fetch origin claude/continue-guthub-development-o0zfs
git branch --set-upstream-to=origin/claude/continue-guthub-development-o0zfs claude/continue-guthub-development-o0zfs
```

`~/.netrc` format (chmod 600):
```
machine github.com
login x-access-token
password ghp_XXXXXXXXXXXX
```

## Sandbox quirks
- No outbound access to tunnels (cloudflared, ngrok), Vercel, Netlify — they 403. GitHub, npm, Google Fonts work.
- `vercel.app` and `app.guthub.ai` are blocked from Playwright screenshots — only localhost dev server works.
- `playwright` requires `ignoreHTTPSErrors: true` for any HTTPS site.
- Git commit signing is broken; `git config commit.gpgsign false` is set in repo.

## Conventions
- All interactive/animated components need `'use client'` at the top.
- Animations: CSS keyframes defined in `globals.css` (bubbleIn, typing, barGrow, pulse, scanMove, popIn, slideUp, heroGlow, authFadeIn, authPopIn) — reference by name in component styles.
- Auth modal: any component can call `openAuth('signup' | 'signin')` from `components/AuthModal.tsx`. It dispatches a `CustomEvent('open-auth')` that the modal listens for.
- Grid layouts that need stable widths: use `minmax(0, 1fr)` instead of bare `1fr`.
- Don't add Tailwind, CSS modules, or styled-components — match the existing inline-style + CSS-var pattern.
