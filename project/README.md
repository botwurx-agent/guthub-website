# GutHub Design System

> **Brand:** GutHub.ai — Your personalized AI gut health assistant.
> **Audience:** Adults 40–75 seeking clarity on gut health and nutrition.
> **Primary conversion:** Founders Cohort signup at $9.95/mo (locked in for life).

GutHub is a custom AI gut-health nutritionist: ongoing support, clarity, and real-time feedback for gut health, nutrition, and overall wellbeing. This design system supports a **redesign of guthub.ai** — warm, premium, high-trust, conversion-focused, modern but familiar.

---

## Index

| File / Folder | Purpose |
|---|---|
| `README.md` | This file — brand, visual, and content foundations |
| `colors_and_type.css` | All color + typography CSS variables and semantic classes |
| `SKILL.md` | Agent-Skills-compatible loader |
| `assets/` | Logos (logo-full.png, logo.png); hero mockups |
| `preview/` | Design-system preview cards (typography, palette, components) |
| `ui_kits/website/` | Marketing website recreation — homepage, products, about, pricing, FAQ |

---

## Product context

**GutHub.ai** is a subscription AI assistant focused on gut health. Unlike static meal plans or one-off diet apps, GutHub is conversational: users ask questions, share context (diet, symptoms, labs), and get personalized guidance that adapts over time.

**Key product surfaces:**
- **Marketing website** (`www.guthub.ai`) — lead capture → Founders Cohort signup
- **App** (`app.guthub.ai`) — chat-first nutrition assistant with progress tracking

**Primary competitor referenced:** [Cal AI](https://www.calai.app/) — food-tracking app with strong consumer polish. GutHub differentiates on *conversation over logging* and *gut-specific guidance*.

**Sources used to build this system:**
- Uploaded logo: `uploads/Color.png` (full horizontal wordmark)
- Live site copy scraped from `www.guthub.ai` (April 2026)
- GitHub repo `botwurx-agent/guthub-website` — was empty/inaccessible at build time; this system is built from the live site + uploaded brand asset. Re-attach the repo and I can align the CSS tokens to the codebase exactly.

---

## CONTENT FUNDAMENTALS

**Voice:** Warm, reassuring, plain-spoken — like a knowledgeable friend who also happens to be a registered dietitian. Never clinical, never hype-y.

**Tonal pillars**
1. **Plain** — short sentences. No jargon unless defined.
2. **Reassuring** — name the anxiety ("you're not alone"), then resolve it.
3. **Credible** — specific over vague ("evidence-based" → "reviewed by RDs").

**Casing & grammar**
- Sentence case for headlines ("Nutrition guidance you can actually talk to"), **not** Title Case.
- Em-dashes for pauses (— not --).
- Contractions are welcome ("you're", "it's", "don't") — they read warm.
- Active voice. "You get guidance that adapts" > "Guidance is adapted to you".

**Pronouns:** Second person ("you", "your"). First-person plural ("we") only when the company is making a promise.

**Forbidden**
- ❌ "Unlock", "supercharge", "revolutionary", "10x", "game-changer"
- ❌ Medical claims ("cure", "treat", "diagnose") — always say "support" or "guidance"
- ❌ Urgency manipulation ("Only 3 left!"). Member counts are OK if true.
- ❌ Emoji in body copy. (Occasional bullet icons in small trust elements — ⚡🔥 — used sparingly in Founders section only.)

**Examples (on-brand):**
- ✅ "Because health questions don't wait."
- ✅ "It's not about perfection. It's about understanding what's happening — and what to do next."
- ✅ "Locked-in lifetime pricing. Cancel anytime. Designed to complement professional care."

**Examples (off-brand, from current live site to be rewritten):**
- ❌ "AI is ur-health health-tech,, brand design, zzaoinitized real meants..." (garbled)
- ❌ Generic "AI-Powered Health Assistant" — replace with benefit-led header.

**CTA vocabulary**
- Primary: "Join the Founders Cohort — $9.95/mo"
- Secondary: "See how it works", "Learn more"
- NEVER: "Get started", "Click here", "Submit"

---

## VISUAL FOUNDATIONS

### Palette — warm + premium

The brand logo gives us a quartet (coral, yellow, green, teal). For the redesign we elevate this to a **warm, premium** palette: cream page ground, deep forest for "serious" surfaces, and a single refined terracotta as the conversion accent. The logo quartet stays intact as a brand mark but is not used as primary UI color.

| Role | Token | Hex | Use |
|---|---|---|---|
| Page bg | `--cream-50` | `#FDFAF3` | Default background — feels like off-white paper |
| Elevated surface | `--bg-elev` | `#FFFFFF` | Cards, modals |
| Muted surface | `--cream-100` | `#FAF5EE` | Subtle section tint |
| Deep bg | `--forest-500` | `#22432E` | Hero alternate, footer, premium sections |
| Primary CTA | `--terracotta-400` | `#DB6F56` | Buttons, focus accents |
| CTA hover | `--terracotta-500` | `#C85A44` | — |
| Body text | `--ink-900` | `#1B1A17` | Never pure black — feels warmer |
| Muted text | `--ink-600` | `#5A564D` | Captions, meta |
| Border | `--ink-200` | `#E0DCD2` | Hairlines — 1px only |

**Rule:** Never combine all four brand-logo colors in UI chrome simultaneously — they live in the logo and in micro-moments (accent dots, bullets, chart colors). Primary UI is cream + forest + terracotta + ink.

### Typography

- **Display:** **Source Serif 4** (high-contrast serif, optical sizes 8–60). Used for H1–H4, pull quotes, editorial moments. Weight 400 at display sizes; 500 at H3/H4.
- **Body:** **Inter** — humanist sans, excellent legibility. 400/500/600/700.
- **Mono:** JetBrains Mono — rare, labels only.

**Accessibility balance:** body floor is **17px**, not the 14–15px of typical SaaS. Line-height 1.55 for body, 1.08–1.18 for display. Hit targets ≥ 44px.

Headlines use **sentence case** with `text-wrap: balance` and mild tracking (`-0.012em`). The serif italic is used as an *editorial* accent — drop one italicized word per headline max.

### Spacing & rhythm

4px base grid. Tokens `--space-1` through `--space-10` (4 → 128px). Generous vertical rhythm: sections are `96px` top/bottom minimum on desktop. Cards use 24–32px inner padding.

### Cards & elevation

Cards are white on cream; **1px border** (`--ink-200`) **plus** soft shadow (`--shadow-sm` or `--shadow-md`). Radius tokens are generous: `--radius-lg` (16px) for cards, `--radius-xl` (24px) for hero surfaces, `--radius-pill` for buttons.

Shadows are **warm** — based on `rgba(40, 30, 20, ...)`, never bluish. Layered: a tight inner + a soft diffuse.

### Borders

1px hairlines only. No 2–3px emphasis borders. The left-colored-accent-border trope is **banned**.

### Backgrounds & imagery

- **Imagery:** Dynamic UI animations showcasing product features (per user direction). Real product screenshots framed in device mockups. No stock photos of food or smiling people in lab coats.
- **No full-bleed hero photos** in this direction — the hero is text-left, UI-right (hero layout 0 chosen).
- **No gradients as backgrounds** (the anti-slop rule). A single very subtle cream→cream-100 vertical wash is acceptable on large sections.
- **No hand-drawn illustrations, no abstract wellness blobs.**
- **Texture:** Pure flat color. Subtle grain is optional at < 3% opacity, never obvious.

### Motion

- **Easing:** `--ease-out` (cubic-bezier(0.2, 0.8, 0.2, 1)) default. `--ease-soft` for longer transitions.
- **Duration:** 120/240/480ms. Micro = 120, UI = 240, scene = 480.
- **Fades + slight translate-Y (8–12px).** No bounces, no springs.
- **Hero + product moments use animated UI (chat bubbles typing in, meal card appearing).**

### States

- **Hover:** Primary buttons darken 8% (terracotta-400 → 500). Cards lift shadow-sm → shadow-md + translate-Y(-2px). Links change color, never underline on hover (underline is always-on).
- **Press:** 98% scale + darker color. No ripple.
- **Focus:** 3px ring in `--terracotta-200` at 40% opacity, 2px offset. Visible for keyboard, suppressed for mouse via `:focus-visible`.
- **Disabled:** 40% opacity, no pointer events.

### Transparency & blur

Used sparingly. The sticky header uses `backdrop-filter: blur(12px)` over `rgba(253, 250, 243, 0.82)`. Modal overlays use `rgba(27, 26, 23, 0.44)` with no blur (performance).

### Layout rules

- Max content width `--maxw-page` (1200px); wide sections may go to `--maxw-wide` (1360px).
- Prose columns `--maxw-prose` (68ch).
- Sticky header 72px tall, cream bg, blur on scroll.

---

## ICONOGRAPHY

GutHub does not ship a custom icon system. The brand mark itself (quartet of coral eye / yellow leaf / green leaf / teal leaf-fork) functions as a **primary visual signature**.

**For UI icons:** Use **[Lucide](https://lucide.dev/)** via CDN — `https://unpkg.com/lucide@latest/dist/umd/lucide.js`. Stroke weight 1.75, size 20–24px. Lucide's plain humanist line style matches our typography (Inter + Source Serif) without competing. **This is a substitution from nothing → Lucide; flag to user if they want a custom set.**

**Emoji usage:** Essentially never. The only exceptions on the current site are ⚡ and 🔥 in the Founders urgency section — these are retained ONLY in that specific context and rendered inline at 1em. Do not introduce emoji anywhere else.

**Unicode chars as icons:** The em-dash (—) is the only one used liberally, as a rhetorical pause.

**Logo files:**
- `assets/logo-full.png` — horizontal wordmark (quartet + "GutHub"), 502×142, transparent PNG
- `assets/logo.png` — icon quartet only, 144×142, transparent PNG

Always display the full logo on light cream or white surfaces. On forest/dark surfaces, invert to cream wordmark (the quartet retains color).

**Clear-space:** Logo height × 0.4 on all sides. Minimum size: 32px height (icon), 96px wide (wordmark).
