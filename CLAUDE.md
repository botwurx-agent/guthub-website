@AGENTS.md

# GuthubAi marketing site

Marketing site for GuthubAi, a personalized AI gut-health platform. Built from a Claude Design handoff in `/home/claude/repo/project/`.

- **Live**: https://guthub-website.vercel.app/
- **Repo**: https://github.com/botwurx-agent/guthub-website
- **Deploy**: Vercel auto-deploys every push to `main`
- **Design source**: `project/README.md` (design tokens, type, component spec) and `project/preview/*.html` (rendered references)

## Stack
- Next.js 16 App Router (Turbopack) — read `node_modules/next/dist/docs/` before assuming APIs
- React 19, TypeScript
- Inline styles using CSS custom properties (no Tailwind, no CSS-in-JS lib)
- `next/font/google` for Source Serif 4 (display, with `axes: ["opsz"]`) + Inter (body) — exposed as `var(--font-display)` / `var(--font-body)`
- `lucide-react` for icons
- Playwright (system-wide at `/opt/node22/lib/node_modules/playwright`) for screenshot verification

## Routes / pages
- `/` — `app/page.tsx` composes `components/home/*` (Hero, ProblemSection, FeaturesSection, HowItWorks, Testimonials, Pricing, FAQ) + shared `FinalCTA`
- `/features` — `app/features/page.tsx` → `components/features/*` (FeaturesHero, OnboardingFlowAnimation, FeatureBlocks, CrossPlatformShowcase, ComingSoon)
- `/pricing` — `app/pricing/page.tsx` → `components/pricing/PricingContent.tsx`
- `/about` — `app/about/page.tsx` → `components/about/*` (AboutHero, FounderStory, WhyGuthub, Beliefs, NotThat, LeadAdvisor, WhatsNext)
- Shared chrome: `components/Header.tsx`, `Footer.tsx`, `AuthModal.tsx`, `FinalCTA.tsx`, `ChatAnimation.tsx`
- Primitives: `components/ui.tsx` exports `Button`, `Badge`, `Eyebrow`, `Reveal` (IntersectionObserver-based fade-in wrapper)

## Design tokens (in `app/globals.css`)
Cream / forest / terracotta palette: `--cream-50/100/200`, `--forest-300/400/500/600`, `--terracotta-300/400/500/600`, `--ink-100..900`. Section backgrounds typically alternate `--cream-50` ↔ `--cream-100` ↔ `--terracotta-50` ↔ `--forest-500` (dark).

## Common workflow
1. **Start dev server first**: `npm run dev` from the repo root (background it, wait for "Ready"). It dies between sessions. The repo path varies per session — use whatever the CWD is (e.g. `/home/user/guthub-website` or `/home/claude/repo`).
2. **Make edits** with Edit/Write tools.
3. **Verify visually**: write a small playwright script to `/tmp/`, screenshot the page or a specific section, Read the PNG. The user can't preview localhost — screenshots are how they confirm.
4. **Commit + push** when the user approves. The PAT is already saved in `~/.netrc` — no need to ask the user for it. If pushes start failing with 401/403, the PAT may have rotated; ask for a fresh one (classic, `repo` scope) and overwrite `~/.netrc` (`machine github.com / login x-access-token / password <PAT>`, `chmod 600`).

## Push protocol (important — don't use `git push origin`)

The sandbox's `origin` remote is a local HTTP proxy (`http://local_proxy@127.0.0.1:40429/...`) that is **read-only** for this identity — `git push origin` 403s, and MCP GitHub write tools also 403. Fetches work fine. Always push directly to `github.com`; credentials come from `~/.netrc`.

**1. Push directly to github.com (auth via `~/.netrc`):**
```
git push https://github.com/botwurx-agent/guthub-website.git <localBranch>:<remoteBranch> 2>&1 | tail -5
```
No inline PAT needed — `~/.netrc` (file mode 600, `machine github.com login x-access-token password <PAT>`) handles auth transparently. If you ever do echo a token, pipe through `sed 's/ghp_[A-Za-z0-9]*/ghp_***/g'`.

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
