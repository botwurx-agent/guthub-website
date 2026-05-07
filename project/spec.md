# GutHub App — Implementation Spec

**Version:** 2.1 (merged from Flask code review + Product Spec v2.0)
**Last updated:** 2026-05-06
**Owner:** Steve Nazari
**Clinical advisor:** Alina Nazari, certified gut health practitioner

> **Architecture note:** Product Spec v2.0 referenced "FastAPI backend infrastructure." That reference is superseded. We are building fresh on Next.js + Supabase. The Flask app is reference only — no Flask/Python code is carried forward.

---

## Stack (confirmed)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router | Already in place for marketing site |
| Database | Supabase Postgres | Managed, RLS, real-time |
| Auth | Supabase Auth | Email/password + Google OAuth + Apple Sign In |
| Storage | Supabase Storage | Meal photos, lab PDFs |
| LLM | OpenAI | gpt-4o for Coach; gpt-4o-mini for Insights Engine summaries |
| Payments | Stripe | 3-tier pricing + founding member cap |
| Hosting | Vercel | Already in place; cron jobs via Vercel Cron |
| Email | Resend | Transactional + trial conversion |
| Styling | Inline styles + CSS vars | Match marketing site convention |

---

## Pricing & trial (confirmed from Product Spec v2.0)

| Tier | Monthly | Annual | Notes |
|---|---|---|---|
| **Founding Member** | $13/mo | $104/yr | First 200 paying conversions. Lifetime price lock. One free 30-min Alina consult. |
| **Launch** | $20/mo | $160/yr | Standard after founding cap hits. |
| **Standard** | $25/mo | — | Post-launch period, timing TBD. |

- **Trial:** 7 days, credit card required, auto-converts to paid
- Founding member cap enforced server-side (counter on paid conversions, not trial signups)
- When cap hits 200, founding tier hidden from pricing page
- Cancel any time during trial: 2 taps (Settings → Subscription → Cancel → Confirm)
- 30-day money-back guarantee on first paid period

---

## Supabase Postgres Schema

> All tables use UUID PKs. `user_id` references `auth.users(id)`.
> RLS enabled on every table — users can only read/write their own rows.
> Timestamps are `timestamptz DEFAULT now()` unless noted.

### `profiles`
Extends Supabase auth. Created by trigger on signup.

```sql
id                    uuid PRIMARY KEY REFERENCES auth.users(id)
username              text UNIQUE NOT NULL
preferred_name        text           -- defaults to first name if blank
created_at            timestamptz DEFAULT now()

-- Identity
name                  text           -- full legal name
dob                   date
gender                text           -- Male | Female | Non-binary | Prefer not to say

-- Physical (always stored in base units)
weight_lbs            numeric        -- stored in lbs; convert kg input
height_in             numeric        -- stored in inches; convert cm/ft input
starting_weight_lbs   numeric        -- set ONCE at first setup, never updated
bmi                   numeric        -- derived, recomputed on weight/height change

-- Health (structured)
medical_conditions    jsonb          -- [{id, label, type: canonical|user_provided, status: active|remission, is_flare: bool}]
sensitivities         jsonb          -- [{id, label, type, severity: severe_allergy|moderate_allergy|intolerance|sensitivity|avoiding|ethical}]
medications           text           -- free-text, AI-parsed for watchlist tags
medication_tags       jsonb          -- parsed: [blood_thinner, MAOI, antibiotic, PPI, steroid, insulin, GLP1, immunosuppressant]

-- Eating
eating_style          text           -- Mediterranean | Low-FODMAP | Vegetarian | Vegan | Pescatarian | Keto | Paleo | No specific style
low_fodmap_phase      text           -- elimination | reintroduction | personalization (only when eating_style=Low-FODMAP)
cooking_frequency     text           -- Almost every meal | Most meals | About half | A few times a week | Rarely
eating_out_frequency  text           -- Rarely | 1-2/week | 3-4/week | 5+/week | Most meals
typical_day_meals     text           -- free-text
caffeine_intake       text
alcohol_intake        text

-- Goals
primary_goals         jsonb          -- array of up to 3 goal IDs
specific_concerns     text
has_worked_with_rd    text           -- Yes currently | Yes in the past | No

-- Lifestyle
sleep_quality         text           -- Great | Pretty good | So-so | Poorly
sleep_hours           numeric        -- optional
energy_level          text           -- High & steady | Steady but low | Up and down | Low most of the day
stress_level          integer        -- 1-10 slider
exercise_routine      text
additional_notes      text           -- Step 6 free-text

-- Sensitive flags (content stays in DB, only flag name goes to AI context)
sensitive_flags       jsonb          -- [history_of_disordered_eating, history_of_mental_health, pregnancy, breastfeeding]

-- AI audience type (derived, cached)
audience_type         text           -- clinical | mild | wellness_driven

-- State
profile_completed     boolean DEFAULT false
age_verified          boolean DEFAULT false   -- true when DOB confirms 18+
onboarding_step       integer DEFAULT 0       -- 0-6, tracks partial completion

-- Trial & subscription
trial_start           timestamptz
trial_end             timestamptz
is_subscribed         boolean DEFAULT false
subscription_tier     text           -- founding | launch | standard
subscription_provider text           -- stripe
subscription_plan     text           -- monthly | annual
stripe_customer_id    text
stripe_subscription_id text
founding_member_slot  integer        -- 1-200 if founding member, NULL otherwise
```

### `meal_logs`
Each logged meal (from photo, voice, or text entry).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
meal_type           text NOT NULL    -- breakfast | lunch | dinner | snack
entry_method        text             -- photo | voice | text
description         text             -- human-readable, from entry method
photo_url           text             -- Supabase Storage URL if photo entry
recognized_foods    jsonb            -- AI-derived: [{name, quantity, unit}]
calories            numeric
protein_g           numeric
carbs_g             numeric
fat_g               numeric
fodmap_level        text             -- low | moderate | high | unknown
sensitivity_flags   jsonb            -- foods that triggered user sensitivity match
dietary_tags        jsonb            -- AI-derived: [high-fiber, lean-protein, etc.]
user_confirmed      boolean DEFAULT false
follow_up_severity  integer          -- 1-5, populated 2hr post-meal via notification
follow_up_at        timestamptz      -- when 2-hr follow-up was answered
deleted             boolean DEFAULT false
updated_at          timestamptz
-- From meal plan (if meal came from plan)
plan_meal_id        uuid REFERENCES meal_plan_slots(id)
```

### `symptom_logs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
symptom_type        text NOT NULL    -- Bloating | Gas | Reflux | Diarrhea | Constipation |
                                     -- Abdominal pain | Brain fog | Fatigue | Nausea | Headache | Other
symptom_label       text             -- for type=Other, user's description
severity            integer NOT NULL -- 1-5
associated_meal_id  uuid REFERENCES meal_logs(id)
notes               text
deleted             boolean DEFAULT false
updated_at          timestamptz
```

### `bowel_movement_logs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
bristol_scale       integer NOT NULL -- 1-7
flags               jsonb            -- [urgency, blood_mucus, incomplete, painful]
notes               text
deleted             boolean DEFAULT false
```

### `weight_logs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
weight_lbs          numeric NOT NULL
is_morning_weight   boolean          -- true if logged before noon
notes               text
deleted             boolean DEFAULT false
```

### `water_logs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
amount_oz           numeric NOT NULL
deleted             boolean DEFAULT false
```

### `note_logs`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
logged_at           timestamptz NOT NULL DEFAULT now()
date                date NOT NULL
text                text NOT NULL
tag                 text             -- Stress | Sleep | Mood | Supplement | Medication | Exercise | Other
deleted             boolean DEFAULT false
```

### `macro_targets`
LLM-calculated TDEE + macro split. Latest row per user = current targets.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
date                date NOT NULL
total_calories      numeric
carbs_pct           numeric
carbs_g             numeric
protein_pct         numeric
protein_g           numeric
fat_pct             numeric
fat_g               numeric
created_at          timestamptz DEFAULT now()
```

### `daily_records`
Aggregated per-day totals (consumed macros + weight snapshot). Derived from logs.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
date                date NOT NULL
current_weight_lbs  numeric DEFAULT 0
goal_weight_lbs     numeric DEFAULT 0
calories_consumed   numeric DEFAULT 0
carbs_consumed      numeric DEFAULT 0
protein_consumed    numeric DEFAULT 0
fat_consumed        numeric DEFAULT 0
water_oz            numeric DEFAULT 0

UNIQUE(user_id, date)
```

### `meal_plans`
A generated plan (N days).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
created_at          timestamptz DEFAULT now()
days                integer          -- 3 | 5 | 7 | 10 | 14
include_snacks      boolean DEFAULT false
status              text DEFAULT 'active'  -- active | archived
```

### `meal_plan_slots`
Individual meal within a plan.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
plan_id             uuid NOT NULL REFERENCES meal_plans(id)
user_id             uuid NOT NULL REFERENCES profiles(id)
plan_date           date NOT NULL
meal_type           text NOT NULL    -- breakfast | lunch | dinner | snack
meal_name           text
prep_time_min       integer
cook_time_min       integer
servings            integer
calories            numeric
protein_g           numeric
carbs_g             numeric
fat_g               numeric
ingredients         jsonb            -- [{item, quantity, unit}]
instructions        text
tags                jsonb            -- [low-FODMAP, dairy-free, high-protein, leftovers]
why_this_meal       text             -- 1-2 sentence personalization note
status              text DEFAULT 'pending'  -- pending | cooked | skipped
```

### `shopping_list_items`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
plan_id             uuid NOT NULL REFERENCES meal_plans(id)
user_id             uuid NOT NULL REFERENCES profiles(id)
item                text
quantity            numeric
unit                text
category            text             -- produce | protein | dairy | pantry | etc.
checked             boolean DEFAULT false
```

### `protocols`
Active food/behavior windows (e.g., no-dairy, low-FODMAP elimination).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
type                text             -- no_dairy | low_fodmap_elimination | custom
label               text             -- human-readable
started_at          timestamptz NOT NULL
ends_at             timestamptz
duration_days       integer
parameters          jsonb            -- protocol-specific config
status              text DEFAULT 'active'  -- active | completed | ended_early
ended_at            timestamptz
created_by          text DEFAULT 'user'    -- user | ai
```

### `coach_threads`
Per-thread conversation sessions in Coach.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
title               text             -- AI-generated from first message
created_at          timestamptz DEFAULT now()
last_message_at     timestamptz
is_saved            boolean DEFAULT false
saved_summary       text             -- AI-generated summary card when saved
```

### `coach_messages`
Messages within a thread.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
thread_id           uuid NOT NULL REFERENCES coach_threads(id)
user_id             uuid NOT NULL REFERENCES profiles(id)
role                text NOT NULL    -- user | assistant | system
content             text
has_image           boolean DEFAULT false
image_path          text             -- Supabase Storage path
image_mime          text
created_at          timestamptz DEFAULT now()
```

### `ai_actions`
Audit log of every tool call the AI made on a user's behalf.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
thread_id           uuid REFERENCES coach_threads(id)
tool                text NOT NULL    -- log_meal | start_protocol | etc.
parameters          jsonb
result              jsonb
created_at          timestamptz DEFAULT now()
```

### `gut_scores`
Cached gut score output from Insights Engine (nightly batch).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
date                date NOT NULL
score               integer          -- 0-100
symptom_load        numeric          -- subtracted from 100
bm_load             numeric          -- subtracted from 100
components          jsonb            -- breakdown for tooltip
computed_at         timestamptz

UNIQUE(user_id, date)
```

### `insights`
Surfaced insights from the Insights Engine.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
type                text             -- correlation | observation | recommendation
category            text             -- food_symptom | sleep_pattern | stress_pattern | etc.
text                text             -- LLM-generated human-readable text
data                jsonb            -- structured underlying data
confidence          text             -- low | medium | high
status              text DEFAULT 'pending_review'  -- pending_review | active | dismissed | retired
surfaced_at         timestamptz
expires_at          timestamptz
dismissed_at        timestamptz
retired_at          timestamptz
retired_reason      text
reviewed_by         text             -- alina | auto
reviewed_at         timestamptz
```

### `correlations`
Statistical correlation data (computed by Insights Engine).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
trigger_type        text             -- food | time_of_day | sleep | stress | water
trigger_value       text
outcome_type        text             -- symptom | bm_irregularity
outcome_value       text
sample_size         integer
hit_count           integer
hit_rate            numeric          -- 0.0-1.0
p_value             numeric
window_days         integer
computed_at         timestamptz
```

### `historical_summaries`
Layer 4 AI context cache (nightly batch).

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id) UNIQUE
summary_json        jsonb            -- full Layer 4 payload
computed_at         timestamptz
```

### `lab_reports`
Uploaded lab reports + parsed structured data.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
filename            text
storage_path        text             -- Supabase Storage (encrypted)
lab_type            text             -- stool | food_sensitivity | blood_work | sibo | oat | hormone
lab_provider        text             -- GI-MAP | Genova | Vibrant | etc.
parsed_markers      jsonb            -- [{name, value, unit, reference_range, status: in_range|out_high|out_low}]
parse_method        text             -- template | ai_vision
parse_confidence    text             -- high | medium | low
user_verified       boolean DEFAULT false
analysis_html       text             -- AI educational triage (not clinical interpretation)
practitioner_shared boolean DEFAULT false
share_link          text             -- signed URL, time-limited
share_link_expires  timestamptz
created_at          timestamptz DEFAULT now()
deleted             boolean DEFAULT false
```

### `goal_weight_updates`
Rate-limit: max 2 goal weight changes per calendar month.

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id)
month               text NOT NULL    -- YYYY-MM
count               integer DEFAULT 0

UNIQUE(user_id, month)
```

### `push_subscriptions`

```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid NOT NULL REFERENCES profiles(id) UNIQUE
endpoint            text NOT NULL
keys                jsonb            -- {p256dh, auth}
created_at          timestamptz DEFAULT now()
```

### Required indexes

```sql
-- All log tables
CREATE INDEX ON meal_logs (user_id, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON symptom_logs (user_id, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON symptom_logs (user_id, symptom_type, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON symptom_logs (user_id, associated_meal_id) WHERE associated_meal_id IS NOT NULL;
CREATE INDEX ON bowel_movement_logs (user_id, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON weight_logs (user_id, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON water_logs (user_id, logged_at DESC) WHERE deleted = false;
CREATE INDEX ON note_logs (user_id, logged_at DESC) WHERE deleted = false;
-- Insights
CREATE INDEX ON insights (user_id, status, surfaced_at DESC);
CREATE INDEX ON correlations (user_id, computed_at DESC);
-- Coach
CREATE INDEX ON coach_messages (thread_id, created_at ASC);
CREATE INDEX ON coach_threads (user_id, last_message_at DESC);
```

---

## Onboarding — 6 steps (confirmed from Product Spec v2.0)

Step grouping resolves the open question from earlier spec.

| Step | Title | Fields |
|---|---|---|
| 1 | About you | Full name, Preferred name, Date of birth, Gender |
| 2 | Health and history | Current weight, Height, Medical conditions (multi-select + autocomplete), Food allergies & sensitivities (multi-select + severity per item), Medications & supplements |
| 3 | How you eat | Eating style (+ Low-FODMAP phase if applicable), Cooking frequency, Eating out frequency, Typical day of meals, Caffeine intake, Alcohol intake |
| 4 | Goals | Primary goals (max 3), Specific concerns, Worked with nutritionist/RD before |
| 5 | Lifestyle | Sleep quality, Sleep duration (if poor), Daily energy, Stress level (1-10 slider), Exercise routine |
| 6 | Final touches | Anything else (free-text), ED screening question (triggers sensitive\_flag), Pregnancy/breastfeeding (triggers conservative mode) |

**Post-submit initialization cascade (background, same as Flask):**
1. Store `current_weight` in today's `daily_record` + `weight_logs`
2. Set `starting_weight_lbs` (immutable baseline, never changes)
3. LLM: calculate `goal_weight` → store
4. LLM: calculate `macro_targets` from profile + goal weight
5. Compute `audience_type` (clinical | mild | wellness_driven)

**Age gate:** DOB < 18 years → block with message, no workaround.

---

## AI Context Model (4 layers, from Product Spec Section 3)

Assembled fresh on every Coach API call. Injected as system prompt.

### Layer 1 — Identity & Profile (~1,000 tokens)
Full profile: identity, health conditions + sensitivities, eating style, goals, lifestyle, sensitive\_flags (flags only, not content).

### Layer 2 — Active State (~400–800 tokens)
Real-time: active protocols (day N of X), active meal plan (next meal), open commitments (AI-made check-ins), recently acknowledged insights.

### Layer 3 — Recent Logs, 14 days (~4,000–8,000 tokens)
Every meal, symptom, BM, weight, water, and note from last 14 days. Full detail. Individual events, not summaries — correlations operate at event level.

### Layer 4 — Historical Summary (~800–1,500 tokens)
Pre-computed nightly by Insights Engine. Includes: headline metrics, top correlations, what's working, what's not, notable changes. Read from `historical_summaries` cache — never recomputed live per request.

### Query-specific Slots (conditional, ~200–2,000 tokens)
Intent-detected via regex/keyword:
- `meal_planning` — current plan, recently saved meals, safe meals
- `symptom_inquiry` — 30-day symptom history, specific correlations, expanded ingredient breakdown
- `lab_inquiry` — all lab reports, parsed markers, practitioner availability
- `progress_inquiry` — 30-day gut score array, annotated changes, goal progress
- `protocol_inquiry` — past protocol history, adherence data

Max 3 slots simultaneously.

### Token budget (per message)

| Layer | Typical | Heavy |
|---|---|---|
| System prompt | 1,500 | 1,500 |
| Layer 1 | 1,000 | 1,200 |
| Layer 2 | 400 | 800 |
| Layer 3 (14d logs) | 4,000 | 8,000 |
| Layer 4 (summary) | 800 | 1,500 |
| Slots (avg 1.5) | 800 | 1,500 |
| Conversation history | 2,000 | 8,000 |
| **Total input** | ~10,500 | ~22,500 |

---

## AI Coach — Function-Calling Agent

The Coach is **not** a text-completion endpoint. It is a function-calling agent that can write structured data to the database on the user's behalf.

### Tools the AI CAN call

```
log_meal(description, photo_url?, time?, meal_type?)
log_symptom(type, severity, time?, associated_meal_id?, notes?)
log_bowel_movement(bristol_scale, time?, flags?, notes?)
log_weight(value, time?, notes?)
log_water(amount_oz, time?)
log_note(text, tag?, time?)
update_meal_plan(modifications)
start_protocol(type, label, duration_days, parameters)
end_protocol(protocol_id)
save_thread(thread_id, generated_title, summary)
schedule_check_in(due_at, topic, thread_id)
fetch_lab_report(report_id)
fetch_meal_history(days, filter?)
fetch_symptom_history(days, type?)
```

### Tools the AI CANNOT call
Modifying profile, deleting any log, sending external communications, modifying billing, booking consults directly.

### Confirmation requirements
- `log_meal/symptom/weight/water` — permissive (user clearly stated intent = call immediately)
- `start_protocol` — describe + ask "want to start it?" before calling
- `update_meal_plan` — describe changes + ask "make these changes?" before calling
- `end_protocol` — confirm before ending an active protocol early

All tool calls written to `ai_actions` audit table.

### System prompt (draft, from Product Spec Section 5)

```
You are Guthub's AI coach. Your clinical voice is shaped by Alina Nazari, a
certified gut health practitioner. You are not Alina, but your approach
reflects how she works with clients: warm but direct, clinically informed,
focused on helping people understand their bodies rather than fearing food.

Your purpose: an intelligent companion that helps people understand their body,
reduce confusion around food, and make sustainable decisions without fear.

Tone: second-person for analysis ("Your data shows..."), first-person for
offers ("I can adjust your meal plan..."). No emojis by default. No em dashes.
Medium-length sentences. Slightly more measured than user's tone.

Forbidden: trigger food (as verb), good food/bad food, cheat day, detox,
excessive empathy theater, fear-based framing.

Audience type detection: read user's intake to assess clinical / mild /
wellness-driven and adapt framing accordingly.

Confidence calibration: high = direct statement. Medium = "your data suggests..."
Low = "I'm not sure, but..."

Honest scaffolding: if user has < 14 days data, be explicit. Do not invent patterns.

Hard refusals: no diagnosis, no prescription med recommendations, no clinical
lab interpretation, no out-of-scope conditions, no engaging crisis content as
coaching (use 988, redirect, no probing).

Memory: within a thread, stay consistent. If user reframes contradicting data,
be curious first; gently surface contradiction if no new info.

Tool calls: confirm before start_protocol / update_meal_plan / end_protocol.
Log permissively when user intent is clear. Tell user what you did.

[Dynamic layers appended per message: conservative_mode, sensitive_flags,
data_tier, active_flare]
```

### Conservative mode
Triggered when user has: active IBD/Crohn's/UC flare, ED history, pregnancy or breastfeeding, histamine intolerance, MCAS, severe reflux, gastroparesis, insulin-dependent diabetes, multiple autoimmune conditions.

Rules: no aggressive elimination (max 3 foods at once), no prolonged fasting, no high-fiber protocols during flares, no caloric restriction language, one variable change at a time, proactive practitioner referrals.

### Data tier behavior
- **Tier 1** (0–13 days, <21 meals): "I'm still learning your patterns." Profile-only context.
- **Tier 2** (14–30 days, 21–60 meals): "Preliminary" framing on all patterns.
- **Tier 3** (30+ days, 60+ meals): Full confidence calibration.

---

## Insights Engine (from Product Spec Section 4)

### Gut Score formula

```
base_score = 100

// Symptom deductions (last 14 days)
severity_weights = {1: -1, 2: -2, 3: -4, 4: -6, 5: -8}
same_symptom_same_day_cap = 1.5x single-log penalty

// BM deductions (last 14 days)
bristol_weights = {1: -3, 2: -2, 3: 0, 4: 0, 5: 0, 6: -2, 7: -3}
flag_blood_mucus = -3
flag_painful = -2
flag_urgency_or_incomplete = -1

score = clamp(base_score - symptom_load - bm_load, 0, 100)
```

Display: integer 0–100. Colors: 0–40 red, 41–65 amber, 66–85 green, 86–100 deep green.
Edge case: zero logs → no score shown, prompt to start logging.

### Correlation detection

Food → symptom within 4-hour window:
- Minimum sample: 5 trigger occurrences in last 30 days
- Hit rate 60–70%: Low confidence (Patterns page only)
- Hit rate 70–85%: Medium confidence (eligible for proactive insight)
- Hit rate 85%+: High confidence (prioritized proactive insight)
- p-value > 0.05: not surfaced regardless of hit rate

Other correlation types: time-of-day → reflux, sleep duration → symptoms, stress (from notes) → severity, BM patterns → preceding meals, water intake → constipation.

### Execution patterns

**Nightly batch** (3am user-local time): reads 90 days of logs, computes correlations, gut score, historical summary, writes to cache tables. Target <2s per user.

**Real-time triggers**: on new log, check if correlation threshold crossed. Surface high-priority insight within seconds.

### Alina review queue

Auto-surfaced (no review needed): food/symptom correlations, sleep/stress/water patterns, bowel patterns, goal progress, "what's working" observations.

**Gated for Alina's review:** insights involving prescription medications, insights referencing lab markers, insights suggesting user change an active protocol.

Alina target: 10–15 min/day in review queue. Admin view: approve / modify / reject / flag for improvement.

### LLM usage in engine

Rule-based correlation detection: pure code, $0.
Statistical analysis: pure code, $0.
Human-readable summaries (Layer 4 + daily insight card): gpt-4o-mini, ~$0.005/user/night.
Total engine cost: ~$0.15/user/month.

---

## LLM Service Layer (`lib/ai/`)

All prompts ported from Flask, updated per Product Spec v2.0.

| File | Function | Model | Temp |
|---|---|---|---|
| `lib/ai/client.ts` | OpenAI singleton | — | — |
| `lib/ai/context.ts` | Assemble 4-layer user context | — | — |
| `lib/ai/macros.ts` | Mifflin-St Jeor + macro split | gpt-4o | 0.1 |
| `lib/ai/goalWeight.ts` | Safe-rate goal weight | gpt-4o | 0.1 |
| `lib/ai/meals.ts` | Meal plan by diet mode | gpt-4o | 0.2 |
| `lib/ai/coach.ts` | Chat + streaming (function-calling agent) | gpt-4o | 0.7 |
| `lib/ai/reports.ts` | Lab report triage (educational, not clinical) | gpt-4o | 0.8 |
| `lib/ai/visionMacros.ts` | Meal photo → macro JSON | gpt-4o | 0.3 |
| `lib/ai/insights.ts` | Trend analysis, weekly check-in | gpt-4o-mini | 0.7 |
| `lib/ai/summary.ts` | Nightly historical summary (Layer 4) | gpt-4o-mini | 0.3 |

### Macro formula (Mifflin-St Jeor, from Flask)
- Men: `BMR = (4.536 × weight_lb) + (15.88 × height_in) − (5 × age) + 5`
- Women: `BMR = (4.536 × weight_lb) + (15.88 × height_in) − (5 × age) − 161`
- Activity: Sedentary ×1.2, Light ×1.375, Moderate ×1.55, Very active ×1.725, Super active ×1.9
- Macros: Maintenance/Gain 40/30/30 carbs/protein/fat; Fat loss 20-30/40/30-40

### Goal weight safe rates (from Flask + Product Spec)
- Loss: 0.5–1 lb/week (2–4 lbs/month); max 1.5 lb/week
- Gain: 0.5–1 lb/month beginners
- If user specifies target: monthly milestone toward it, not final target

### Diet modes (10, from Flask)
default, keto, carnivore, paleo, vegan, wfpb, gluten_free, low_fodmap, high_protein_low_carb, intermittent_fasting

High-protein-low-carb hard constraint: protein ≥35g AND carbs ≤25g per meal.

---

## Route Structure

```
app/
  (marketing)/              # existing marketing pages — no auth
    page.tsx
    features/page.tsx
    pricing/page.tsx
    about/page.tsx

  (app)/                    # protected — Supabase session + active access
    layout.tsx              # AppShell: sidebar + topbar
    today/page.tsx          # Dashboard
    log/page.tsx            # Daily log timeline
    plan/page.tsx           # Meal planner
    insights/
      page.tsx              # Trends tab (default)
      patterns/page.tsx     # Patterns tab
      reports/page.tsx      # Test Reports tab
    coach/page.tsx          # AI coach (thread list + chat)
    settings/page.tsx       # Profile + subscription

  onboarding/               # auth required, no AppShell, 6 steps
    page.tsx

  auth/
    callback/route.ts       # Supabase OAuth callback

  api/
    ai/
      chat/route.ts              # POST — non-streaming
      chat/stream/route.ts       # POST — SSE streaming
      macros/route.ts            # POST — calculate macro targets
      goal-weight/route.ts       # POST — calculate goal weight
      meals/route.ts             # POST — generate meal plan
      report/route.ts            # POST — lab report triage
      vision-macros/route.ts     # POST — extract macros from image
      insights/route.ts          # POST — trend analysis
      weekly-summary/route.ts    # POST — weekly check-in narrative

    logs/
      meal/route.ts              # GET/POST
      symptom/route.ts           # GET/POST
      bm/route.ts                # GET/POST
      weight/route.ts            # GET/POST
      water/route.ts             # GET/POST
      note/route.ts              # GET/POST
      [type]/[id]/route.ts       # PATCH/DELETE (soft delete)

    tracking/
      daily/route.ts             # GET/POST daily_records
      gut-score/route.ts         # GET gut scores (from cache)

    meals/
      plan/route.ts              # POST generate, GET current plan
      plan/[id]/route.ts         # PATCH (swap meal, update status)
      save/route.ts              # POST accept/save slot
      library/route.ts           # GET saved meals

    insights/
      route.ts                   # GET surfaced insights
      [id]/dismiss/route.ts      # POST dismiss insight
      correlations/route.ts      # GET correlation data (symptom-food)

    reports/
      upload/route.ts            # POST upload + parse PDF
      [id]/route.ts              # GET report detail
      [id]/share/route.ts        # POST generate share link for Alina

    coach/
      threads/route.ts           # GET list, POST new thread
      threads/[id]/route.ts      # GET thread + messages
      threads/[id]/save/route.ts # POST save thread

    stripe/
      checkout/route.ts          # POST create checkout session
      webhook/route.ts           # POST Stripe webhook
      portal/route.ts            # POST customer portal session

    export/route.ts              # POST generate data export ZIP
    notifications/subscribe/route.ts  # POST VAPID push subscription

  api/cron/
    nightly-insights/route.ts    # Vercel Cron — 3am user-local (batched)
    weekly-checkin/route.ts      # Vercel Cron — Monday 8am UTC
```

---

## Middleware

```typescript
// middleware.ts — applies to (app) route group only
// 1. No Supabase session → redirect to / (marketing, open auth modal)
// 2. Session + no active access (trial expired / not subscribed) → redirect to /pricing
// 3. Session + active access + profile_completed=false → redirect to /onboarding
// 4. Session + age_verified=false (DOB < 18) → block with age message
```

---

## Differentiator Features

### 1. Symptom-Food Correlation Engine
Pattern detection across `meal_logs` and `symptom_logs`. SQL query + LLM synthesis after 14+ days of data. Surfaced in Insights > Patterns tab. Proactive insight card on Today dashboard when threshold crossed.

Route: `api/insights/correlations/route.ts`

### 2. Weight Loss Timeline Projection
Average weekly delta from `weight_logs` → projected goal date.
```
avg_weekly_delta = mean of weekly weight changes (last 4 weeks)
weeks_remaining = (current_weight - goal_weight) / avg_weekly_delta
projected_date = today + (weeks_remaining × 7)
```
No LLM needed. Displayed in Log page weight card below progress bar. Shows: projected date, weeks remaining, avg weekly rate, on-track / off-track / plateau status.

### 3. Weekly Check-In (Proactive Coach Nudge)
Vercel Cron, Monday 8am UTC. Pulls last 7 days of logs, generates 2–3 sentence summary + 1 specific action suggestion, injects as system message at top of Coach. User opens Coach and sees it waiting. Temperature 0.7, gpt-4o-mini.

---

## Stripe Integration

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_FOUNDING`, `STRIPE_PRICE_ID_LAUNCH`, `STRIPE_PRICE_ID_STANDARD`, `STRIPE_BYPASS_MODE`

Webhook events:
- `customer.subscription.created` → `is_subscribed=true`
- `customer.subscription.updated` → update tier, handle cancel_at_period_end
- `customer.subscription.deleted` → `is_subscribed=false`
- `invoice.payment_succeeded` → ensure active
- `invoice.payment_failed` → 7-day grace, email user

Founding member cap: server-side counter on paid conversions. When 200 reached, founding tier hidden.

---

## Input Normalization

Weight → lbs: "70kg" × 2.20462 | "154lb/lbs" strip unit | plain number = lbs
Height → inches: "5'7\"" = (5×12)+7 | "170cm" ÷ 2.54 | plain number = inches

---

## Notifications

Max 2 push/day, max 1 email/week (excl. transactional). Quiet hours 9pm–8am user-local (no exceptions).

Key triggers:
- 2-hour post-meal follow-up: "How's your gut feeling 2 hours after [meal]?" Severity 1–5 quick-tap.
- Day 5 trial email: "Two days left — and what your coach has learned about you so far."
- Monday weekly check-in: injected into Coach, not push.
- High-confidence insight: proactive push + Today dashboard card.

Never send: weight-related notifications to users with `history_of_disordered_eating` flag. No "you broke your streak" notifications.

---

## Build Order

1. **AppShell + route group** — sidebar, topbar, protected layout, middleware
2. **Supabase Auth** — email/password + Google OAuth + Apple Sign In; 7-day trial + credit card on signup; founding member tier logic
3. **Onboarding** — 6-step form, unit normalization, post-submit cascade (goal weight + macros + audience_type)
4. **Today Dashboard** — gut score card, macro summary, proactive coach card (placeholder), quick-add tiles, this week at a glance
5. **Log** — timeline view, all 6 log types (meal photo/voice/text, symptom, BM Bristol, weight, water, note), edit/soft-delete, 2-hr follow-up scheduling
6. **Plan** — meal planner with 10 diet modes, 7-day default, shopping list, mark-as-cooked auto-log, swap meal
7. **Insights** — Trends tab (gut score chart, weight trend), Patterns tab (correlation cards), past patterns
8. **Coach** — function-calling agent, streaming SSE, 4-layer context assembly, thread list + save, image upload
9. **Insights Engine** — nightly batch cron: gut score computation, correlation detection, Layer 4 summary generation, Alina review queue
10. **Weight timeline projection** — avg weekly delta → projected goal date in Log page
11. **Symptom-food correlation** — correlation API + Patterns tab surfacing
12. **Weekly check-in cron** — Monday 8am, proactive Coach message
13. **Lab Reports / Test Reports** — PDF upload, hybrid parsing, educational triage, Alina practitioner referral, share link
14. **Stripe paywall** — 3-tier checkout, webhook, customer portal, founding member cap
15. **Settings** — profile edit, subscription management, data export, account deletion
16. **Wire marketing CTAs** — "Start free trial" → onboarding
17. **Doctor Report PDF export** — 3–5 page curated PDF for clinical review
18. **Mobile responsive pass**
19. **Empty / loading / error states + accessibility**
20. **Push notifications** (VAPID web push)

---

## Open Questions (unresolved)

- **Supabase project:** Not yet created. Do this before any code.
- **Resend account:** Set up and get `RESEND_API_KEY` before auth is built (trial email required day 5).
- **Alina reviews (pending her sign-off):** symptom tier lists, medical condition tiers, goal list wording, gut score weights, system prompt, recipe clinical constraints, lab educational annotations.
- **Legal review (pending attorney):** Section 7 (Test Reports) disclaimer language, Privacy Policy, Terms of Service, HIPAA posture (aligned vs. formal), founder-spouse disclosure.
- **Founding member campaign:** waitlist vs. soft-launch beta vs. live — decide before building Stripe tier.

## Resolved questions (from earlier spec)

- ✅ Gut score formula: defined above (base 100, severity weights, Bristol penalties)
- ✅ Symptom types: Bloating, Gas, Reflux, Diarrhea, Constipation, Abdominal pain, Brain fog, Fatigue, Nausea, Headache + Other
- ✅ Onboarding step grouping: 6 steps defined above
- ✅ Trial length: 7 days (not 3)
- ✅ Pricing: 3 tiers confirmed
- ✅ FastAPI reference: discarded — building fresh on Next.js + Supabase
