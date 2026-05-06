# GutHub App — Implementation Spec

**Status:** Ready to build. Flask app fully reviewed.
**Last updated:** 2026-05-06
**Branch:** `claude/continue-guthub-backend-QiJwE`

---

## Stack (confirmed)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Already in place for marketing site |
| Database | Supabase Postgres | Managed, row-level security, real-time |
| Auth | Supabase Auth | Email/password + social; replaces plaintext Flask passwords |
| Storage | Supabase Storage | Meal photos, lab PDFs (replaces per-user filesystem folders) |
| LLM | OpenAI gpt-4o | Existing prompts tuned for it; abstract via `lib/ai/` |
| Payments | Stripe | Port working Flask logic directly |
| Hosting | Vercel | Already in place |
| Email | Resend | Transactional (welcome, trial expiry warnings) |
| Styling | Inline styles + CSS vars | Match marketing site convention |

---

## Supabase Postgres Schema

> All tables use UUID primary keys. `user_id` always references `auth.users(id)` (Supabase auth).
> Row-level security (RLS) enabled on every table: users can only read/write their own rows.

### `profiles`
Extends Supabase auth.users. Created automatically on signup via trigger.

```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id)
username        text UNIQUE NOT NULL
created_at      timestamptz DEFAULT now()

-- Onboarding profile (24 fields)
name            text
dob             date
gender          text
weight_lbs      numeric       -- stored in lbs, always
height_in       numeric       -- stored in inches, always (convert ft/in/cm on input)
starting_weight_lbs  numeric  -- set ONCE at first setup, never updated

weight_history       text
medications          text
medical_conditions   text
family_history       text
allergies            text
exercise             text
diet                 text
eating_preferences   text
eating_out           text
cooking_habits       text
hydration            text
alcohol_caffeine     text
goals                text
short_long_term_goals text
past_experience      text
concerns             text
sleep_pattern        text
energy_levels        text
stress_levels        text
additional_notes     text

profile_completed    boolean DEFAULT false

-- Trial
trial_start     timestamptz
trial_end       timestamptz

-- Subscription (Stripe)
is_subscribed               boolean DEFAULT false
subscription_provider       text       -- 'stripe'
subscription_plan           text       -- 'pro_monthly'
stripe_customer_id          text
stripe_subscription_id      text
```

### `daily_records`
One row per user per calendar date. Tracks logged weight and consumed macros.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
date            date NOT NULL
current_weight_lbs  numeric DEFAULT 0
goal_weight_lbs     numeric DEFAULT 0
calories_consumed   numeric DEFAULT 0
carbs_consumed      numeric DEFAULT 0
protein_consumed    numeric DEFAULT 0
fat_consumed        numeric DEFAULT 0

UNIQUE(user_id, date)
```

### `macro_targets`
LLM-calculated TDEE and macro split. Latest row per user = current targets.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
date            date NOT NULL
total_calories  numeric
carbs_pct       numeric
carbs_g         numeric
protein_pct     numeric
protein_g       numeric
fat_pct         numeric
fat_g           numeric
created_at      timestamptz DEFAULT now()
```

### `meals`
Per-user meal logs. One row per meal slot per day.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
date            date NOT NULL
meal_type       text NOT NULL   -- 'breakfast' | 'lunch' | 'dinner'
meal_name       text
directions      text
ingredients     jsonb           -- string[]
calories        numeric DEFAULT 0
carbs           numeric DEFAULT 0
protein         numeric DEFAULT 0
fat             numeric DEFAULT 0
sodium          numeric DEFAULT 0
created_at      timestamptz DEFAULT now()
```

### `tracking`
Time-series scalars: gut score, water intake, calorie tracker.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
date            date NOT NULL
type            text NOT NULL   -- 'gut_score' | 'water_intake' | 'calorie_tracker'
value           numeric DEFAULT 0

UNIQUE(user_id, date, type)
```

### `reports`
Lab report PDF analysis results.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
filename        text
storage_path    text            -- Supabase Storage path (replaces local PDF_DIR)
analysis_html   text            -- HTML-formatted LLM analysis
created_at      timestamptz DEFAULT now()
```

### `conversations`
Coach chat message history.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
role            text NOT NULL   -- 'user' | 'assistant' | 'system'
content         text
has_image       boolean DEFAULT false
image_path      text            -- Supabase Storage path
image_mime      text            -- 'image/jpeg' etc.
created_at      timestamptz DEFAULT now()
```

### `goal_weight_updates`
Rate-limit: max 2 goal weight changes per calendar month.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
month           text NOT NULL   -- 'YYYY-MM'
count           integer DEFAULT 0

UNIQUE(user_id, month)
```

### `symptoms` *(new — does not exist in Flask app)*
Core to the design handoff. Missing from Flask; must be built fresh.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
logged_at       timestamptz DEFAULT now()
date            date NOT NULL
symptom_type    text NOT NULL   -- 'bloating' | 'gas' | 'cramps' | 'constipation' | 'diarrhea' | 'reflux' | 'nausea' | 'fatigue' | 'other'
severity        integer         -- 1–10 scale
notes           text
```

### `push_subscriptions`
VAPID web push. One per user.

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id) UNIQUE
endpoint        text NOT NULL
keys            jsonb           -- {p256dh, auth}
created_at      timestamptz DEFAULT now()
```

---

## Feature Inventory (from Flask code review)

### ✅ Built in Flask (port to Next.js)

#### Auth & Access
- Signup with username + password → 3-day free trial auto-granted
- Login / logout
- Session persistence
- Subscription gate (`require_active_subscription` decorator → Next.js middleware)
- Trial expiry detection + messaging

#### Onboarding (6 steps → single page in Flask, design handoff has multi-step)
Form fields (24):
`name, dob, gender, weight, height, weight_history, medications, medical_conditions, family_history, allergies, exercise, diet, eating_preferences, eating_out, cooking_habits, hydration, alcohol_caffeine, goals, short_long_term_goals, past_experience, concerns, sleep_pattern, energy_levels, stress_levels, additional_notes`

Post-form initialization cascade (async, background):
1. Store `current_weight` in today's `daily_record`
2. Set `starting_weight` (immutable baseline for progress %)
3. LLM: calculate `goal_weight` → store in `daily_record`
4. LLM: calculate `macro_targets` from profile + goal_weight

#### Dashboard (Today)
- Gut score (latest from tracking)
- Calorie tracker (7-day array)
- Water intake (7-day array)
- Gut health tip (random from static JSON)
- Meal of the day (rotates by weekday from static JSON)
- Report counts per day

#### Goal Tracker (Log)
- Per-day weight logging (current_weight)
- Per-day macro logging (calories, carbs, protein, fat consumed)
- Goal weight display + progress % (loss vs gain logic — uses immutable starting_weight)
- Goal weight update (2× per month limit) → triggers macro recalculation
- Date navigation (prev/next within current month)
- Missing days detection
- AI analysis of multi-day trends (LLM call)
- Meal photo macro extraction (vision LLM → pre-fills macro inputs)

#### Meal Planner (Plan)
- 10 diet modes: default, keto, carnivore, paleo, vegan, wfpb, gluten_free, low_fodmap, high_protein_low_carb, intermittent_fasting
- Single meal or full-day generation
- Last-meal deduplication
- Accept/save meal plan to a specific date
- Simplicity rules: ≤8 ingredients, ≤30 min, basic cooking methods

#### AI Coach (Coach)
- Persistent chat with conversation history (per user, stored in DB)
- Full 24-field user profile injected as system context on session start
- SSE streaming responses (token-by-token)
- Image upload support (meal photos, etc.)
- Conversation download as PDF
- Clear conversation

#### Lab Report Analysis (Insights)
- PDF upload
- Text extraction (PDFProcessingService)
- LLM analysis: abnormalities, health implications, recommendations, lifestyle adjustments
- Handles: <, >, ≤, ≥, +/++/+++/++++, scientific notation, qualitative markers
- Saves analysis as HTML to DB
- Previous reports list + reload

#### Macro Calculator
- Mifflin-St Jeor BMR formula
- Activity multiplier (5 levels)
- Macro split by goal (maintenance/gain: 40/30/30; fat loss: 20-30/40/30-40)
- Converts to grams (carbs÷4, protein÷4, fat÷9)

#### Profile / Settings
- Edit all 24 profile fields
- View subscription status + trial days remaining
- Cancel subscription (Stripe Customer Portal redirect)

#### Stripe Integration
- Single plan: $20/month (`pro_monthly`)
- Stripe Checkout Session creation
- Webhook: `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`
- Customer Portal (manage/cancel)
- Bypass mode (dev only, env-gated)

#### Web Push Notifications
- VAPID push subscription registration
- Send notification endpoint

### ❌ Not in Flask (build fresh)
- **Symptom tracking** — confirmed missing; core to design handoff gut score calculation
- Multi-step onboarding (Flask has single long form; design has 6 animated steps)
- Email (welcome, trial expiry warning at day 1 remaining)
- Gut score calculation logic (Flask stores values but no calculation visible in app.py — likely manual entry or stub)

---

## LLM Service Layer (`lib/ai/`)

All prompts ported from Flask. Abstracted so provider is swappable.

### `lib/ai/client.ts`
```typescript
// OpenAI client singleton, server-side only
// model: process.env.OPENAI_MODEL ?? 'gpt-4o'
// max_tokens: 2048
// Temperatures: CONSISTENT=0.1, BALANCED=0.3, DEFAULT=0.7, CREATIVE=0.85
```

### Functions to port (one file per domain)

| File | Flask origin | Description |
|---|---|---|
| `lib/ai/macros.ts` | `calculate_macros_with_model` | Mifflin-St Jeor + macro split → JSON |
| `lib/ai/goalWeight.ts` | `calculate_goal_weight_with_model` | Safe rate goal weight → JSON |
| `lib/ai/meals.ts` | `analyze_meals_with_model` | Meal plan by diet preference → JSON |
| `lib/ai/coach.ts` | `generate_response` + `generate_response_stream` | Chat (non-streaming + SSE) with image support |
| `lib/ai/reports.ts` | `analyze_test_report_response` | Lab PDF analysis → HTML |
| `lib/ai/visionMacros.ts` | `extract_macros_from_image` | Meal photo → macro JSON |
| `lib/ai/insights.ts` | `analyze_goal_tracker_response` | Multi-day trend analysis |

### Key prompt details to preserve

**Macro formula** (Mifflin-St Jeor):
- Men: `BMR = (4.536 × weight_lb) + (15.88 × height_in) − (5 × age) + 5`
- Women: `BMR = (4.536 × weight_lb) + (15.88 × height_in) − (5 × age) − 161`

**Goal weight safe rates**:
- Loss: 0.5–1 lb/week (2–4 lbs/month); max 1.5 lb/week
- Gain: 0.5–1 lb/month beginners
- If user specifies target: calculate monthly milestone toward it, not final target

**Progress % formula**:
- Uses immutable `starting_weight` as baseline (never updates)
- Loss: `(starting − current) / (starting − goal) × 100`
- Gain: `(current − starting) / (goal − starting) × 100`
- Capped at 100%

---

## Route Structure (Next.js App Router)

```
app/
  (marketing)/           # existing marketing pages — no auth
    page.tsx             # /
    features/page.tsx
    pricing/page.tsx
    about/page.tsx

  (app)/                 # protected — requires Supabase session + active access
    layout.tsx           # AppShell: sidebar + topbar
    today/page.tsx       # Dashboard
    log/page.tsx         # Goal tracker / daily log
    plan/page.tsx        # Meal planner
    insights/page.tsx    # Lab reports + trends
    coach/page.tsx       # AI chat
    settings/page.tsx    # Profile + subscription

  onboarding/            # separate flow — auth required, no AppShell
    page.tsx             # Multi-step form (6 steps per design handoff)

  auth/                  # Supabase auth callbacks
    callback/route.ts

  api/                   # Server-side API routes
    ai/
      chat/route.ts          # POST — non-streaming coach chat
      chat/stream/route.ts   # POST — SSE streaming coach chat
      macros/route.ts        # POST — calculate macro targets
      goal-weight/route.ts   # POST — calculate goal weight
      meals/route.ts         # POST — generate meal plan
      report/route.ts        # POST — analyze lab report PDF
      vision-macros/route.ts # POST — extract macros from image
      insights/route.ts      # POST — goal tracker trend analysis
    stripe/
      checkout/route.ts      # POST — create checkout session
      webhook/route.ts       # POST — Stripe webhook handler
      portal/route.ts        # POST — customer portal session
    tracking/
      daily/route.ts         # GET/POST — daily record (weight, macros)
      weekly/route.ts        # GET/POST — weekly calorie/water
    meals/
      save/route.ts          # POST — accept meal plan
    reports/
      upload/route.ts        # POST — upload PDF → analyze
      [id]/route.ts          # GET — load report
    symptoms/
      route.ts               # GET/POST — symptom log (new)
    notifications/
      subscribe/route.ts     # POST — VAPID push subscription
```

---

## Middleware

```typescript
// middleware.ts
// 1. If no Supabase session → redirect to / (marketing, auth modal)
// 2. If session but no active access (trial expired, not subscribed) → redirect to /pricing
// 3. If session + active access but profile_completed=false → redirect to /onboarding
// Applies to: (app) route group only
```

---

## Input Normalization (port from UserService)

Weight input → always store as lbs:
- "70kg" → multiply by 2.20462
- "154lb" / "154lbs" → strip unit
- plain number → assume lbs

Height input → always store as inches:
- "5'7\"" / "5ft7in" → (feet × 12) + inches
- "170cm" → divide by 2.54
- plain number → assume inches

---

## Stripe Integration Details

Single plan: $20/month  
Env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`

Webhook events to handle:
- `customer.subscription.created` → set `is_subscribed=true`, store subscription_id
- `customer.subscription.updated` → update plan, handle cancellation_at_period_end
- `customer.subscription.deleted` → set `is_subscribed=false`
- `invoice.payment_succeeded` → ensure subscription active
- `invoice.payment_failed` → flag for retry / notify user

Bypass mode: `STRIPE_BYPASS_MODE=true` env var (dev only) → skip Stripe, activate directly

---

## Build Order

1. **AppShell + route group** — sidebar, topbar, protected layout
2. **Supabase Auth** — signup/login wired to marketing site CTAs, 3-day trial grant on signup
3. **Onboarding** — 6-step form (design handoff), unit normalization, post-submit cascade (goal weight + macros LLM calls)
4. **Today** — dashboard with gut score, weekly charts, gut tip, meal of the day
5. **Log** — daily record CRUD, weight tracking, macro logging, progress %, date navigation
6. **Plan** — meal planner with 10 diet modes, accept/save flow
7. **Insights** — lab report upload, PDF extraction, LLM analysis, previous reports
8. **Coach** — streaming chat, image upload, conversation history, clear/download
9. **Symptom tracking** — new feature (schema ready, needs design finalization)
10. **Stripe paywall** — checkout, webhook, customer portal
11. **Settings** — profile edit, subscription management
12. **Wire marketing CTAs** — "Start free trial" → onboarding
13. **Mobile responsive pass**
14. **Empty / loading / error states**
15. **Push notifications** (VAPID)

---

## Open Questions

- **Gut score calculation**: Flask stores values but no calculation logic found in app.py. Likely manually entered by user (1–10?) or a composite. Need to decide: manual entry, or calculated from symptom severity + macro adherence?
- **Symptom types**: Flask has none. Design handoff has the UX. Decide canonical list: bloating, gas, cramps, constipation, diarrhea, reflux, nausea, fatigue, other?
- **Onboarding step breakdown**: Flask has 1 form with 24 fields. Design handoff shows 6 animated steps — need to group fields into 6 logical steps.
- **Email provider**: Resend chosen — set up account and wire `RESEND_API_KEY` before auth is built.
- **Supabase project**: Not yet created — do this before any code.
- **GitHub repo for the app**: `botwurx-agent/Guthub-app` exists but is empty — the app code will live here.
