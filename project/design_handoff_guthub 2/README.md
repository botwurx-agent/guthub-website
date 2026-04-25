# Handoff: GutHub — Marketing Site & App Prototype

## Overview

GutHub is an AI-powered gut-health companion that helps users decode the link between what they eat and how they feel. This handoff covers **two coupled deliverables** that ship together:

1. **Marketing site** (`ui_kits/website/`) — public-facing pages: Home, Features, Pricing, About, Coming Soon
2. **App prototype** (`app/`) — the logged-in product: 6-step Onboarding + 7-page web app (Today, Log, Plan, Insights, Coach, Community, Settings)

Both share a single design system (colors, type, logos, voice).

---

## About the Design Files

The files in this bundle are **design references created in HTML** — prototypes showing intended look, structure, and behavior. They are not production code to copy directly.

This handoff extends an **existing GutHub codebase** (the marketing site) that has already been built and deployed. The app pages described here are to be added to that same codebase.

### Existing target codebase

- **Framework:** Next.js 16.2.4, App Router (`app/` directory), React 19.2, TypeScript 5
- **Dev server:** Turbopack via `next dev`
- **Styling:** Inline `style={{}}` props consuming CSS custom properties. No CSS-in-JS. No CSS modules. Tailwind is installed but inactive — ignore it (or remove it).
- **Token source:** All design tokens live in `app/globals.css` under `:root`. This is the **single source of truth** for colors, fonts, type scale, and semantic aliases. Do **not** introduce a new token system; consume these vars directly via `style={{ color: 'var(--ink-900)' }}`.
- **Fonts:** Loaded via `next/font/google` — Source Serif 4 (display, with optical-size axis) and Inter (body), exposed as `--font-display` / `--font-body`.
- **Icons:** `lucide-react`.
- **Semantic classNames:** A handful (`hero-grid`, `cards-3-grid`, etc.) defined in `globals.css` for media queries — follow this pattern when responsive layout warrants it; default to inline styles otherwise.

### What that means for implementation

- **Match the marketing site's styling pattern** — inline styles + CSS vars. Do not introduce Tailwind utilities, CSS-in-JS, or CSS modules just for the app.
- **Reuse the existing tokens** in `app/globals.css`. The token names below in this README map 1:1 onto vars already defined there. If you find a value used in the prototype that isn't in `globals.css`, add it there (don't hardcode).
- **Heads-up on Next.js 16:** training data may pre-date it. When in doubt, consult current Next.js docs rather than guess.
- The HTML prototypes use Babel-standalone for in-browser JSX compilation. **Drop that approach** — these are reference only. Port the structure into the existing Next.js app.

---

## Fidelity

**High-fidelity (hifi)** — every page is pixel-designed with final colors, typography, spacing, and interactions. Recreate the UI faithfully using the target codebase's libraries and patterns. All colors, font sizes, spacing, and component shapes are intentional.

Charts on the Insights page are simple inline SVG sparklines and trend graphs; you may swap them for a chart library (Recharts, Chart.js, etc.) as long as visual style is preserved.

---

## Design Tokens

All tokens are defined as CSS custom properties in **`colors_and_type.css`** (project root). Recreate these in your target system (Tailwind config, CSS vars, theme file — your call).

### Colors

**Cream** — warm off-white backgrounds, surfaces
- `--cream-50` `#FDFAF3` (page background)
- `--cream-100` `#F7F1E5`
- `--cream-200` `#EFE6D2`
- `--cream-300` `#E5D9BE`

**Forest** — deep green for sidebar, dark surfaces, primary text-on-dark
- `--forest-300` `#5C8A6B`
- `--forest-400` `#3F6B4F`
- `--forest-500` `#2D5239` (sidebar background)
- `--forest-600` `#1F3D2A`
- `--forest-700` `#142A1B`

**Terracotta** — primary action color (buttons, active states, accents)
- `--terracotta-50`  `#FBEEE7`
- `--terracotta-200` `#F0BFA8`
- `--terracotta-300` `#E89E80`
- `--terracotta-400` `#D97757` (primary)
- `--terracotta-500` `#C4593A`
- `--terracotta-600` `#9F4528`
- `--terracotta-700` `#7A3320`

**Brand accents** — used sparingly for chart fills, illustrations, badges
- `--brand-yellow` `#F4C430`
- `--brand-green`  `#7AB562`
- `--brand-teal`   `#5FB3A8`

**Ink** — neutrals, text on light backgrounds
- `--ink-100` `#EAE6DD`
- `--ink-200` `#D4CFC2` (borders)
- `--ink-300` `#B8B1A1`
- `--ink-500` `#6B6557` (muted text)
- `--ink-600` `#4F4A3F`
- `--ink-700` `#34302A`
- `--ink-800` `#23201C`
- `--ink-900` `#1B1A17` (primary text)

### Typography

- **Display font** (`--font-display`) — used for: page titles, hero headlines, score numbers, recipe titles, large numerics. A serif/transitional with character. Letter-spacing typically `-0.01em` to `-0.02em`.
- **Body font** (`--font-body`) — used for: UI labels, paragraphs, navigation, buttons, all small text. Modern humanist sans.

Both font files live in `assets/` and are loaded via `@font-face` at the top of `colors_and_type.css`. Replace with comparable web fonts in production (or self-host the same files).

**Type scale (px)**
| Use | Size | Weight | Family |
|---|---|---|---|
| Hero (H1) | 56–72 | 400 | display |
| Page title (H1) | 38–44 | 400 | display |
| Section title (H2) | 26–32 | 400 | display |
| Card title (H3) | 18 | 600 | body |
| Body | 15–16 | 400 | body |
| Small / meta | 13 | 400 | body |
| Eyebrow / label | 11 | 700 | body, uppercase, `letter-spacing: 0.14em` |

### Spacing scale
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 80px. Cards typically use 24px internal padding. Page gutters: 32–48px.

### Radii
- Small (pills, buttons): `999px`
- Inputs, small cards: `12px`
- Cards: `16px`
- Hero/recipe images: `14–18px`

### Shadows
Mostly flat. Where shadows appear: `0 4px 12px rgba(20, 42, 27, 0.06)` for hovering cards, `0 0 0 3px rgba(217, 119, 87, 0.15)` for active selection rings.

---

## Assets

| Asset | Path | Usage |
|---|---|---|
| Logo, color on light | `assets/logo.png` | Marketing nav, light surfaces |
| Logo, color on dark | `assets/logo-dark.png` | App sidebar, onboarding panel — includes white wordmark |
| Display font | `assets/<display-font>.woff2` | All display headings |
| Body font | `assets/<body-font>.woff2` | All UI |
| Illustrations | `assets/` | Hero/feature illustrations on marketing site |

**Recipe images in the app are CSS gradient placeholders** (no real photography). Production should use a real food-photography library or AI-generated images.

---

## Marketing site

Files in `ui_kits/website/`:
- `index.html` — Home (hero, value props, social proof, CTA)
- `features.html` — Six feature blocks with mobile/desktop split-screen showcase
- `pricing.html` — Tiered pricing
- `about.html` — Mission, team
- `coming-soon.html` — 6-card grid of upcoming features

### Marketing → App coupling
- All "Start free trial", "Get GutHub", and "Sign up" CTAs should route into the app's Onboarding flow (`app/GutHub App.html`).
- The marketing site uses the **same** design tokens and logo files as the app. Keep them in sync.
- Marketing **Features** copy describes capabilities — review it against the "What's mocked" table below before launch.

---

## App: Screens / Views

The app shell (`AppShell.jsx`) provides a persistent dark-green left sidebar (240px wide), a top bar with search + Quick log + notifications + avatar, and a main content area. Sidebar nav: Today · Log · Plan · Insights · Coach (with "AI" badge). Footer nav: Restart onboarding (dev affordance) · Community · Settings · Need help?

### Onboarding (6 steps)

A two-column layout: left panel is dark green (`--forest-500`) with the dark-bg logo, a personalized greeting, and a step indicator. Right panel is the form on cream background.

Steps:
1. **About you** — preferred name, pronouns, age, height, weight, body composition.
2. **Health & history** — existing conditions, medications, allergies, "have lab work?" toggle.
3. **How you eat** — eating style (Mediterranean, low-FODMAP, etc.), things to avoid, cuisine preferences, meals per day, cooking skill.
4. **Goals** — primary goal (weight loss, symptom relief, energy, performance), target weight, timeline.
5. **Lifestyle** — activity level slider, average sleep, stress level, water goal.
6. **Final touches** — notification style, Coach voice (warm/clinical/coach-like), units (imperial/metric).

Each step uses chip selectors, sliders, segmented controls, and short forms. Realistic defaults are pre-filled for the demo persona "Steve."

**Action on completion:** persist all 6 steps' answers as a structured user profile, not just a `gh_onboarded` flag.

### 1. Today (default route)

A 12-column grid: 8-col main area + 4-col right rail.

**Main area (top → bottom):**
- **Page header** — date eyebrow, "Good afternoon, Steve" with `<em>` accent, subtitle.
- **AI nudge card** — full-bleed dark forest-600 card with a proactive Coach insight ("You bloated 4 of 5 times after dairy in the last 14 days"). Two CTAs: "Start the 7-day window" (cream button) + "Talk it through with Coach" (ghost).
- **Today's meals card** — meal rows (time · plate icon · title · meta · gut-flag pills). Dashed "Add dinner" button at the bottom.
- **Tonight's suggested dinner** — recipe row with gradient placeholder image, title, meta (clock/flame/leaf), "Cook this" + "Swap" buttons.

**Right rail:**
- **Score ring** — 168px circle, 100-point gut score (e.g. 72) drawn as a stroked SVG arc in terracotta-400. "Gut score" label inside the ring; "+8 this week" pill BELOW the ring (small forest-500 text). Three legend dots underneath: Sleep good (green), Stress mid (yellow), Bloat ↓ (terracotta).
- **Macros today** — 4 mini-cards (Kcal, Protein, Carbs, Fat) with current/goal numbers and a thin progress bar.
- **How you're feeling** — last 3 symptoms with smile/meh/frown icon, kind, time, severity.
- **Test report analysis card** — dark forest-600 background, lab icon, "1 report analyzed", short copy, View results / Upload buttons.
- **Streak card** — cream-100 background, flame icon in terracotta circle, "12-day logging streak."

### 2. Log

Unified timeline: meals + symptoms + weight + notes interleaved chronologically by day. Quick-add tiles at top (Meal, Symptom, Weight, Note) open the Quick Log modal. Right rail shows weekly stats.

### 3. Plan

A 12-col grid: 8-col plan + 4-col shopping list / settings.

**Main area:**
- **Week strip** — 7 day buttons in a row, active day highlighted in terracotta-50 with terracotta-300 border. Display number large.
- **Day's meals** — header reads "{Day} — pick a meal to view or regenerate". Three recipe rows (breakfast/lunch/dinner) each with gradient image, meal-type label, title, meta, and Regenerate + Save buttons. Active meal has terracotta-300 border + soft glow.
- **Active recipe detail** — header with "Recipe — {meal}" eyebrow + recipe title + Share + Mark cooked buttons. Below: 220px image (with "30 min · serves 2" pill) + macros (4 mini-stats) + dietary pills, all in a row. Below that: 2-column ingredients/method.

**Right rail:**
- **Shopping list** — grouped by category (Produce, Protein, etc.) with checkboxes. "Send to phone" + "Open in Instacart" buttons.
- **Plan settings** — eating style, avoiding, calorie target, servings.

### 4. Insights

Three tabs: Trends · Patterns · Test reports.

**Trends tab** — Gut score sparkline (30-day), Weight + Bloating mini-charts, Macros stats grid (Avg fiber, protein, hydration, sleep). Right rail: "What's working" + "What to watch" insight cards.

**Patterns tab** — Trigger food correlations table (food → symptom · % rate · 12-occurrence count · confidence pill).

**Test reports tab** — Vibrant Wellness Gut Zoomer 3.0 lab card with 5 markers (name, value, reference range, status pill, plain-language note). Sidebar: dashed-border upload card + past reports list.

### 5. Coach

Three-column layout: thread list (left) · conversation (center) · context panel (right).

- Empty state shows starter prompts ("Decode my symptoms", "Plan a week of meals", "Read my lab work", etc.).
- Messages render with markdown. Coach replies can include action cards (e.g. "I built you a 3-day meal plan — open it") that route to Plan.
- AI uses `window.claude.complete()` in the prototype. Replace with your production LLM endpoint.

### 6. Community / Settings / Help

Stub pages — visual placeholders for navigation completeness. Build out post-launch.

### Quick Log modal

Top-bar Quick log button or any "+" affordance opens a modal with 4 tabs: Meal · Symptom · Weight · Note. Each tab is a short structured form.

---

## Components

| Component | File | Role |
|---|---|---|
| `AppShell` | `app/components/AppShell.jsx` | Sidebar + topbar + main slot |
| `Sidebar`, `TopBar` | `app/components/AppShell.jsx` | Layout chrome |
| `Onboarding` + `OnbStep*` | `app/components/Onboarding.jsx` | 6-step intake |
| `PageToday` | `app/components/PageToday.jsx` | Dashboard |
| `PageLog` | `app/components/PageLog.jsx` | Timeline |
| `PagePlan` | `app/components/PagePlan.jsx` | Plan + recipe + shopping |
| `PageInsights` | `app/components/PageInsights.jsx` | Trends + patterns + labs |
| `PageCoach` | `app/components/PageCoach.jsx` | AI chat |
| `PageMisc` | `app/components/PageMisc.jsx` | Community/Settings/Help stubs |
| `Icon` | `app/components/Icon.jsx` | Lucide-style inline SVGs (~50 names) |
| `Badge` | `app/components/Badge.jsx` | Status pills (good/warn/bad) |
| `Button` | `app/components/Button.jsx` | Variants: primary, soft, ghost, sm/md/lg, btn-block |
| `MockData` | `app/components/MockData.jsx` | All seeded data (single source) |

Reusable primitive classes (defined in `app.css`):
- `.btn` `.btn-primary` `.btn-soft` `.btn-ghost` `.btn-sm` `.btn-block`
- `.card` `.card-header` `.card-title` `.card-eyebrow`
- `.row` `.col` `.row-between` `.grid grid-12` `.col-4` `.col-8`
- `.pill` `.pill-good` `.pill-warn` `.pill-bad`
- `.event` `.event-icon` `.event-title` `.event-meta` (timeline rows)
- `.recipe` `.recipe-img` `.recipe-meal-type` `.recipe-title` `.recipe-meta`
- `.macros` `.macro` `.macro-val` `.macro-label` `.macro-bar`
- `.score-ring` `.score-val`
- `.tabs` `.tab` `.tab.active`
- `.bar` (progress bars)
- `.subtle` `.muted` `.eyebrow` `.tnum`

---

## State Management

The prototype uses **React `useState` only** — no Redux, Zustand, etc. Production should choose one:
- **Server state** (user profile, logs, plans, conversations) → React Query / SWR / TanStack Query
- **UI state** (current route, modals, form drafts) → local component state, or Zustand for cross-page concerns

State variables in the prototype:
| Variable | Where | Purpose |
|---|---|---|
| `screen` | `App` | `'onboarding'` \| `'app'` — guarded by `localStorage.gh_onboarded` |
| `route` | `App` | Current page id |
| `quickLog` | `App` | `null` \| `'meal'` \| `'symptom'` \| `'weight'` \| `'note'` — modal driver |
| `data` | `Onboarding` | All collected onboarding answers |
| `step` | `Onboarding` | 0–5 |
| `tab` | `PageInsights` | Active tab id |
| `activeDay`, `activeMeal` | `PagePlan` | Selection state |

---

## Interactions & Behavior

- **Onboarding** — Continue button advances; Back navigates. On final step, "Finish & enter app" sets `gh_onboarded` and routes to Today.
- **Sidebar nav** — clicking sets `route`. Active item gets terracotta-400 background.
- **Restart onboarding** — pill button in sidebar footer; clears `gh_onboarded` and re-mounts onboarding. **Dev/demo affordance only — remove or gate behind admin flag in production.**
- **Quick Log** — top-bar button or any "+" opens the modal. Tabs switch the form. Submit currently no-ops; wire to API.
- **Plan** — clicking a meal row sets `activeMeal`, which drives the recipe detail card. Regenerate is UI-only; wire to a meal-gen API.
- **Coach** — submit message → `window.claude.complete()` → render reply. Replace with production endpoint.

### Animations / transitions
- Subtle: hover state changes (background opacity), 0.15s ease.
- Score ring uses `strokeDasharray`/`strokeDashoffset` to draw the arc — animate on first mount with a 0.6s ease-out.
- No page transitions; navigation is instant.

---

## What's Real vs. What's Mocked

| Feature | State | Notes |
|---|---|---|
| Coach AI chat | ✅ Real call | `window.claude.complete()` (Claude Haiku via artifact host) — replace with your endpoint |
| Onboarding answers | ⚠️ Collected, not persisted | Capture into a real user profile API on Step 6 |
| Today: gut score, macros, meals, symptoms | 🟡 Mocked | All from `MockData.jsx` |
| Log timeline | 🟡 Mocked | Quick-log modal collects but doesn't persist |
| Plan / recipes / shopping list | 🟡 Mocked | "Regenerate" is UI-only |
| Insights: trends, patterns | 🟡 Mocked | Static arrays |
| Test reports | 🟡 Mocked | Upload UI exists; no OCR/parsing |
| Doctor PDF export | ❌ Button only | Implement PDF generation |
| Community / Settings / Help | 🟡 Stub pages | Visual placeholders |
| Auth (signup/login/SSO) | ❌ Not built | Required before launch |
| Notifications | ❌ Not built | Bell icon is decorative |
| Mobile responsive | ❌ Not built | Desktop-first design |

---

## Suggested Implementation Order

1. **Add app routes to the existing Next.js codebase** — use a route group: `app/(app)/today/page.tsx`, `app/(app)/log/page.tsx`, etc. Marketing stays in `app/(marketing)/` (or wherever it lives now).
2. **Verify design tokens** — confirm every color/font/spacing value used in the prototype already exists in `app/globals.css`. Add anything missing there (don't hardcode in components).
3. **Build auth** — pick a provider (Supabase Auth, Clerk, NextAuth) and stand it up. Block the `(app)` route group behind it.
4. **Implement onboarding + user profile persistence** — the 6-step intake writes a structured `user_profile` record. This is the foundation; every other page reads from it.
5. **Build app shell** — sidebar + topbar + main slot, matching `app/components/AppShell.jsx` from the prototype, using inline styles + CSS vars.
6. **Build Today, Log, Plan, Insights, Coach** in that order, replacing `MockData` with real fetch hooks.
7. **Wire Coach to a production LLM** (Anthropic SDK, server-side route handler) with the user profile + recent logs in the system prompt.
8. **Wire marketing CTAs** ("Sign up", "Get GutHub", "Start free trial") to route into the new onboarding flow.
9. **Mobile responsive pass** — every page needs a phone breakpoint. Add semantic classNames + media queries in `globals.css` where inline styles aren't enough.
10. **Empty / loading / error states** for every page.
11. **Accessibility audit** — keyboard nav, screen-reader labels, focus rings, color contrast.

---

## Files in this bundle

| Path | Purpose |
|---|---|
| `README.md` (this file) | Implementation guide |
| `colors_and_type.css` | Design tokens — single source of truth |
| `app/GutHub App.html` | App entry point — open in browser to interact |
| `app/app.css` | All app-specific styles |
| `app/components/*.jsx` | All React components (12 files) |
| `app/assets/*` | Logos, fonts, illustrations used by the app |
| `ui_kits/website/*` | Marketing site HTML files |
| `assets/*` | Shared logos, fonts, illustrations |

To preview the prototype, open `app/GutHub App.html` in a browser. It runs entirely client-side with no build step.
