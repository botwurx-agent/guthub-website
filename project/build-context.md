# GutHub App Build — Working Context

**Purpose:** This document captures the state of the GutHub app build planning so Claude Code can pick up where it left off across sessions. It is for the user (Steve) and for any future Claude session resuming this work.

**Last updated:** 2026-05-06

**Status:** Pre-build. Waiting on the existing developer to push his Flask codebase to Steve's GitHub.

---

## How to resume in a new session

If you (Claude Code, in a future session) are reading this: the user is **Steve**, founder of GutHub. The previous session was an investigation of the existing developer's work and a strategic decision about the path forward. Read this whole doc top-to-bottom, then continue from "Pending actions" below.

When opening a new session, Steve should say something like:
> *"Continuing the GutHub app build. Read `project/build-context.md` for context."*

---

## The product

GutHub is an AI-powered gut-health companion. The full product design is in a separate branch on this repo — fetch it before reading code:

```bash
git fetch origin design/backend-handoff
git show origin/design/backend-handoff:'project/design_handoff_guthub 2/README.md'
```

Key features per the design handoff:
- 6-step Onboarding flow → user_profile
- Today (dashboard with gut score, AI nudge, meals, macros, symptoms)
- Log (timeline of meals/symptoms/weight/notes)
- Plan (meal planning + recipe generation + shopping list)
- Insights (trends, patterns, test report analysis)
- Coach (LLM chat with action cards)
- Community/Settings (stub pages)

---

## What exists already

### Marketing site (live, this repo's `main` branch)

- https://guthub-website.vercel.app/
- Next.js 16 App Router, React 19, TypeScript
- Inline styles + CSS custom properties (tokens in `app/globals.css`)
- Tailwind installed but inactive — ignore it
- Auto-deploys on push to `main`
- See root `CLAUDE.md` and `AGENTS.md` for marketing-site conventions

### Existing developer's Flask app (to be migrated as reference)

Lives on AWS Lightsail VM:
- Lightsail instance name: `Guthub-machine`
- Public IP: `3.235.129.6` (login page is reachable here over HTTPS)
- Region: `us-east-1` (Virginia)
- Spec: 8 GB RAM, 2 vCPUs, 160 GB SSD ($40/mo)
- OS: Ubuntu 24.04
- Code path on VM: `/home/ubuntu/GutHub/`

Stack:
- Python Flask 3.0 + Flask-SQLAlchemy
- SQLite (multiple files; no managed DB)
- OpenAI for LLM
- Stripe (with webhooks) for payments
- nginx with TLS as reverse proxy
- PM2 process manager (running Python under PM2 — unusual)
- code-server (browser-based VSCode) on port 8888 — the developer edited live on the server
- Web push notifications (VAPID), but no email/SMS service

Source code repo:
- `git@github.com:Stinxel/GutHub.git` — **in the developer's personal account, NOT Steve's**
- Active branch: `wasif`
- Steve has *requested* the developer push it to a fresh repo under Steve's GitHub — waiting on response

`app.py` is a 2,837-line monolithic file. Mixed storage (SQLAlchemy + TinyDB + JSON files + per-user folders). SQLite DBs at `DB/meals.db`, `DB/meals1.db`, `logs/guthub.db`, `instance/guthub.db`.

Status: deployed but never launched. **Zero real users, zero paying customers** (confirmed against the database and Stripe dashboard). $0 in AWS data transfer last month.

### Features already built in the Flask app

From the templates and routes:
- Signup / onboarding (`signup.html`, `user_form.html`, `waiting.html`)
- Dashboard (`dashboard.html`)
- Goal tracker (`goal_tracker.html`)
- AI Coach (`AI.html`)
- Snap & Know-style meal photo macros (`extract_macros_page.html`)
- Test report analysis (`report_analysis.html`, `previous_reports.html`, `test_report_analysis.html`)
- Pricing / Stripe paywall (`pricing.html`, `subscription_cancelled.html`, `invite_key.html`)

What is **not** built (per the developer himself): symptom tracking — which is core to the new design.

### Env var names wired in `.env` (no secrets — names only)

- `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TEMPERATURE`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BYPASS_MODE`
- `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- `SECRET_KEY` (Flask sessions)
- `Top_P_R`, `Top_P_C`, `Temp_R`, `Temp_C` — LLM tuning, two profiles (likely R=Reports, C=Chat)
- `MODEL_PATH`, `CONTEXT_LIMIT`, `MAX_NEW_TOKENS` — possibly a secondary local model
- `CONVERSATION_DIR`, `USERDATA_DIR`, `PDF_DIR` — local filesystem paths

**Notably absent:** `DATABASE_URL`, email service, image storage (S3/Cloudinary), analytics, SMS, vector DB.

### AWS account state

- Account: `guthubai` / ID `192722010137` — **owned by Steve**
- Last month's bill: **$71.57**
  - Lightsail: $42.57 (the VM)
  - Developer Support plan: $29.00 — **TO BE CANCELLED** (pure waste)
  - Other services: $0.00
- 2 KMS keys exist; AWS-managed defaults ($0)
- No EC2 / RDS / Lambda / S3 / Cognito / etc. — Lightsail is the only real thing
- Default VPC networking in every region (also free)

---

## Strategic decision

**Build fresh on a Next.js + Supabase stack. Use the existing Flask app as a *reference document*, not a foundation.**

Reasoning:
- No paying users → no migration burden, full freedom to start clean
- Flask app has architectural problems we'd inherit (monolith, mixed storage, SQLite scaling, single VM)
- Polished new design fits Next.js naturally; retrofitting onto Flask templates would be miserable
- Steve can maintain Next.js + Supabase with Claude; can't realistically maintain Flask + Lightsail + SQLite alone
- The existing code's value is its OpenAI prompts, LLM tuning parameters, Stripe integration, PDF parsing logic, and data model — that value is preserved by *reading* the code, not by running it

---

## Stack decisions (tentative — finalize after code review)

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js 16 App Router | Already in place for marketing site |
| UI styling | Inline styles + CSS vars | Match marketing-site convention |
| Database | Supabase Postgres | Managed, friendly console |
| Auth | Supabase Auth | Clerk also reasonable |
| Storage | Supabase Storage | For meal photos, lab PDFs |
| LLM | OpenAI initially | Tuned prompts already exist; abstract via `lib/ai/` service layer for future provider swap |
| Payments | Stripe | Port working logic from Flask app |
| Hosting | Vercel | Already in place |
| Email | Resend | Transactional only initially |
| Monitoring | Sentry | `sentry-sdk` was in Flask requirements but never wired |

The user mentioned researching GPT-5.1 as cheap-and-capable; this is a per-call config decision, not a stack decision. Architecture should stay provider-agnostic via the `lib/ai/` service layer pattern.

---

## Pending actions

### Waiting on developer (request sent)

- [ ] Push GutHub Flask codebase to a fresh repo under Steve's GitHub (e.g. `github.com/<steve-username>/guthub-app`)
- [ ] Confirm in writing that all code/designs/content are Steve's IP

### To do once code transfer arrives

- [ ] Clone Steve's new repo into this Claude Code session
- [ ] Read through the Flask app systematically — routes, data model, OpenAI prompts, Stripe flow, PDF parsing
- [ ] Produce a specification doc capturing every feature in implementation-ready language
- [ ] Sketch the new Postgres schema (including symptom tracking, which doesn't exist yet)

### To do this week (independent of developer)

- [ ] Cancel AWS Developer Support plan ($29/mo savings)
- [ ] Set up MFA on AWS root account if not already done
- [ ] Decide GitHub username/org for the new app repo

### Do NOT do yet

- 🚫 Don't rotate any secrets — we need the running app accessible for reference extraction
- 🚫 Don't shut down the Lightsail VM — needed for code/data review
- 🚫 Don't start coding the new app — write the spec doc first
- 🚫 Don't push to `main` of this repo without explicit Steve approval

---

## Plan timeline

### This week
- Receive code from developer
- Cancel waste services
- Confirm IP ownership

### Next 1–2 weeks
- Study existing Flask code, write specification doc
- Finalize stack decisions (set up Supabase project, etc.)
- Sketch Postgres schema

### Weeks 3+ — incremental build (per the design handoff README's suggested order)

1. App routes + protected route group + AppShell (sidebar/topbar shell)
2. Auth
3. Onboarding + `user_profile` persistence
4. Today, Log, Plan, Insights, Coach pages — in that order
5. Coach LLM wiring (server-side OpenAI route handler)
6. Wire marketing CTAs ("Start free trial" etc.) to onboarding
7. Mobile responsive pass
8. Empty / loading / error states + accessibility audit
9. Stripe paywall + billing
10. Launch readiness

---

## Open questions to revisit

- **LLM model choice:** OpenAI is the default since the existing Flask app already tunes its prompts for OpenAI. Steve mentioned GPT-5.1 as cheap-and-capable; verify current pricing and capabilities (vision, structured output, prompt caching, latency) before committing.
- **Mixed-provider setup?** Technically optimal (Anthropic stronger for Coach + long-context analysis; OpenAI fine for vision + structured extraction). Adds operational complexity. Default to single-provider initially, abstract via `lib/ai/` service layer for easy swap.
- **Mobile strategy:** Web-responsive only at launch? PWA install? Native app later?
- **Compliance:** Health data + test report uploads = real privacy considerations even before formal HIPAA. Decide on disclaimers, consent flow, deletion-on-request, encryption-at-rest before user data is collected.

---

## Key references

- Marketing site code (this repo) — styling reference for the app
- `project/design_handoff_guthub 2/` on branch `origin/design/backend-handoff` — design specification (fetch first; not on `main`)
- Flask app source — pending transfer to Steve's GitHub
- Marketing site live: https://guthub-website.vercel.app/
- Existing Flask app login: https://3.235.129.6/
