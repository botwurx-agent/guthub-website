# GutHub Website — Developer Handoff

This is the marketing site for GutHub, a personalized AI gut-health platform.
Everything needed to run, build, and deploy is here.

---

## 1. Repository

- **GitHub:** https://github.com/botwurx-agent/guthub-website
- **Default branch:** `main` — every push auto-deploys to production via Vercel
- **Current live URL:** https://guthub-website.vercel.app/

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + TypeScript |
| Styling | Inline styles + CSS custom properties in `app/globals.css` (no Tailwind, no CSS-in-JS lib) |
| Fonts | `next/font/google` — Source Serif 4 (display) + Inter (body) |
| Icons | `lucide-react` |
| Hosting | Vercel (auto-deploy on push to `main`) |

No database, no backend, no auth provider wired up — it's a static marketing
site. The "Sign in / Sign up" modal (`components/AuthModal.tsx`) is a UI stub
that doesn't post anywhere yet; the developer will need to wire it to whatever
auth provider the product uses.

---

## 3. Local setup

```bash
git clone https://github.com/botwurx-agent/guthub-website.git
cd guthub-website
npm install
npm run dev         # http://localhost:3000
```

Requires Node.js 20+.

Other scripts:
```bash
npm run build       # production build
npm run start       # run the production build locally
npm run lint        # ESLint
```

There are **no environment variables** required to build or run the site.

---

## 4. Deploying to a live domain

The site is already connected to Vercel under the `botwurx-agent/guthub-website`
repo. To point a real domain (e.g. `guthub.ai`) at it:

1. **Vercel dashboard** → project `guthub-website` → **Settings → Domains**.
2. **Add domain** → enter the apex domain (`guthub.ai`) and `www.guthub.ai`.
3. Vercel will show the DNS records to set:
   - Apex `guthub.ai`: **A record** → `76.76.21.21` (Vercel's anycast IP)
   - `www.guthub.ai`: **CNAME** → `cname.vercel-dns.com`
4. Update DNS at the registrar (Cloudflare / GoDaddy / wherever the domain is
   registered). Propagation is usually < 1 hour.
5. Vercel will auto-issue a Let's Encrypt TLS cert once DNS resolves.
6. In Vercel, pick whichever of `guthub.ai` or `www.guthub.ai` should be
   primary and set the other to redirect.

**If the project needs to be moved to the client's own Vercel account:**
- In Vercel, **Settings → General → Transfer project**, or
- Disconnect and the client can import the GitHub repo fresh under their team.

Any Node-capable host (Netlify, Cloudflare Pages, Render, AWS Amplify, a VPS
with `npm run build && npm run start`) will run this without changes — Vercel
is just the easy path.

---

## 5. Project structure

```
app/
  layout.tsx            # root layout, font variables
  globals.css           # design tokens + keyframes + responsive overrides
  page.tsx              # /  (home)
  features/page.tsx     # /features
  pricing/page.tsx      # /pricing
  about/page.tsx        # /about
components/
  Header.tsx            # sticky nav + mobile hamburger menu
  Footer.tsx
  AuthModal.tsx         # Sign in / Sign up modal (stub — needs wiring)
  FinalCTA.tsx          # shared bottom CTA block
  ChatAnimation.tsx     # animated iPad-style chat mockup in the hero
  ui.tsx                # Button, Badge, Eyebrow, Reveal primitives
  home/                 # sections composed on the home page
  features/             # sections for /features
  pricing/              # sections for /pricing
  about/                # sections for /about
public/                 # logos + imagery served at /
project/                # original Claude Design handoff (reference only, not shipped)
```

---

## 6. Design tokens

All colour, spacing, radius, shadow, and typography tokens live as CSS custom
properties in `app/globals.css` (`:root { --cream-50: ...; ... }`). The three
brand families:

- **Cream** — `--cream-50..400` (backgrounds)
- **Forest** — `--forest-50..700` (accents, dark sections)
- **Terracotta** — `--terracotta-50..700` (primary accent / CTAs)
- **Ink** — `--ink-100..900` (text)

Section backgrounds alternate cream / terracotta / forest for rhythm.

---

## 7. Conventions to know before editing

- Any component with state, effects, or event handlers needs `'use client'`
  at the top (Next.js App Router default is server components).
- Styling pattern throughout is **inline `style={{ ... }}` + CSS variables**.
  Responsive overrides are in `app/globals.css` under `@media (max-width: 767px)`
  and use `!important` because inline styles win the cascade.
- Animations are CSS keyframes in `globals.css` (`bubbleIn`, `typing`,
  `heroGlow`, `authFadeIn`, etc.), referenced from component inline styles.
- The auth modal listens for a global `open-auth` CustomEvent. Any component
  can trigger it via the `openAuth('signup' | 'signin')` helper exported from
  `components/AuthModal.tsx`.
- Grid layouts that need stable column widths use `minmax(0, 1fr)` rather
  than bare `1fr` to prevent overflow from long content.

---

## 8. Things the next developer will want to wire up

The site is production-ready as a marketing page, but these are clearly stubs:

- **AuthModal** (`components/AuthModal.tsx`) — UI only; hook up to the real
  auth provider (Clerk / Auth0 / Supabase / custom).
- **"Start your 2-day free trial" CTA** buttons throughout — they currently
  open the auth modal. Wire to the actual signup/billing flow.
- **Analytics** — no analytics is installed. Add Vercel Analytics, PostHog,
  GA4, etc. as needed.
- **Email capture / newsletter** in the footer — the form currently has no
  submission handler.
- **Metadata / SEO** — `app/layout.tsx` has a minimal `<Metadata>` export;
  add OG images, per-page titles/descriptions, sitemap, robots.txt as the
  product nears launch.
- **Favicon** — currently the Next.js default; replace `app/favicon.ico`
  with the GutHub mark.

---

## 9. Known notes / gotchas

- **Next.js 16 is brand new** — APIs differ from older Next versions. When in
  doubt, consult `node_modules/next/dist/docs/` rather than online tutorials
  written for Next 13/14/15.
- The `project/` folder is the original Claude Design handoff (HTML previews
  and design-token docs). It's kept in the repo for reference but isn't
  imported by the app — feel free to remove once no longer useful.
- `CLAUDE.md` and `AGENTS.md` are instructions for the AI assistant that
  built the site. Safe to delete or ignore.

---

## 10. Contacts

- Design system source: `project/README.md`
- Questions about implementation choices: commit history on `main` has fairly
  descriptive messages explaining the "why" behind each change.
