# GutHub — Investor Pitch Reference
### AI-Powered Gut Health Companion
**www.guthub.ai · app.guthub.ai**

---

## 1. THE PROBLEM

Gastrointestinal conditions are among the most prevalent, costly, and chronically mismanaged health issues in the world.

- **70 million Americans** are affected by digestive diseases — IBS, IBD, Crohn's, GERD, and related conditions
- The average patient waits **6–10 years** to receive a correct diagnosis
- Patients see **5 or more specialists** before finding answers
- GI conditions are the **#2 cause of workplace absenteeism** in the US
- $136 billion is spent annually on digestive disease care in the US alone — yet outcomes remain poor

The fundamental gap: **patients have no structured, personalized way to understand the relationship between what they eat, how they feel, and what's happening in their gut.** They leave appointments with a pamphlet and a food diary that no one ever analyzes.

Gastroenterologists have 15-minute appointment windows. They cannot monitor 30 days of behavior between visits. Patients cannot connect the dots themselves.

---

## 2. THE SOLUTION

**GutHub is a personalized AI gut health companion** that sits between the patient and the specialist — logging, learning, analyzing, and coaching in real time.

Not a generic nutrition tracker. Not a symptom diary. A clinical-grade, AI-driven system that:

1. **Learns each user's unique trigger profile** through structured logging
2. **Identifies food-symptom correlations** that would take a nutritionist months to find
3. **Coaches in natural language** with full context of the user's health history
4. **Generates clinically structured reports** ready for the gastroenterologist visit
5. **Guides safe dining decisions** in real time using menu photo analysis

GutHub turns every patient into an informed participant in their own care — and gives clinicians the longitudinal data they've never had access to.

---

## 3. MARKET OPPORTUNITY

### Total Addressable Market (TAM)
The global digestive health market is valued at **$47.4 billion** (2023), projected to reach **$74.2 billion by 2030** — a CAGR of 6.8%.

### Serviceable Addressable Market (SAM)
Digital health apps for GI conditions represent a rapidly growing subsegment. With 70M+ Americans affected and smartphone penetration above 85%, the addressable digital health population exceeds **40 million US users**.

### Serviceable Obtainable Market (SOM)
Targeting the engaged, health-conscious segment willing to pay for a premium personalized tool: conservatively **2–5 million users** in the near term.

### Why Now
- AI capabilities have reached the point where personalized health coaching is genuinely useful — not just a chatbot
- Post-COVID consumer willingness to invest in personal health apps has accelerated
- GLP-1 drugs (Ozempic, Wegovy) have created 30M+ new patients acutely focused on gut and metabolic health
- Telehealth normalization has lowered the barrier to digital-first healthcare tools

---

## 4. THE PRODUCT

GutHub is a full-stack web application available at **app.guthub.ai**, built for daily use across five core pillars:

---

### 4.1 Intelligent Onboarding
Before the user logs a single meal, GutHub builds a complete health profile:

- Medical conditions (IBS, IBD/Crohn's, GERD, celiac, etc.)
- Known allergens and food sensitivities
- Eating style and dietary approach (12 options including keto, low-FODMAP, WFPB, carnivore, etc.)
- Primary health goals (weight, symptom reduction, energy, muscle, etc.)
- Activity level, sleep quality, stress levels
- Prior experiences with dietitians and gastroenterologists
- Current medications and supplements

This profile is the foundation for everything the AI does. Every recommendation, every meal plan, every coaching response is personalized to this intake — not a generic population average.

**AI-calculated macros:** On onboarding completion, the system uses the user's current weight, goal weight, body measurements, health goals, and eating style to calculate a personalized daily calorie and macronutrient target. Not a BMI formula — a contextual calculation that accounts for where they're starting and where they want to go.

---

### 4.2 Comprehensive Daily Logging
Six logging categories, all date-aware and timezone-correct:

**Meal Logging**
- Meal type (breakfast, lunch, dinner, snack, beverage)
- Ingredients and nutritional breakdown
- AI-powered photo analysis — photograph a meal and the AI identifies ingredients, estimates portions, and calculates macros
- Manual entry with full nutritional fields

**Symptom Logging**
- Symptom name, severity (1–10), and onset timing relative to meals
- Duration tracking
- Free-text notes
- Every symptom entry triggers a gut score recalculation for that day

**Bowel Movement Logging**
- Bristol Stool Scale classification (Types 1–7)
- Urgency rating and pain rating
- Every BM entry also triggers gut score recalculation

**Water, Weight, and Notes**
- Daily water intake tracking toward personalized targets
- Weight logs feeding a 90-day trend chart
- Freeform notes that the AI coach can reference in context

---

### 4.3 Gut Score
GutHub's proprietary daily wellness metric — a single number (0–100) that quantifies gut health on any given day.

The score is computed algorithmically from:
- Symptom severity and count (weighted penalty)
- Bristol Stool Type distribution (Types 3–4 are optimal; Types 1–2 and 6–7 penalize the score)
- Urgency and pain ratings from BM logs

The gut score is:
- **Displayed** on the dashboard as a visual ring with daily trend
- **Charted** over 30 days in Insights with labeled milestones
- **Included** in the Doctor Report as a clinical trend line
- **Persisted** to the database after every symptom and BM log for longitudinal analysis

This single metric gives users an at-a-glance understanding of their gut health without requiring clinical expertise to interpret.

---

### 4.4 AI Coach
A full conversational AI built on OpenAI's most capable models, with one critical differentiator: **complete contextual awareness**.

Every conversation has access to:
- Full intake profile (conditions, allergens, eating style, goals, medications, sleep, stress)
- Recent meal logs and water intake
- Recent symptom logs with severity and onset timing
- Current meal plan
- Historical notes

This is not a generic health chatbot. When a user asks "why does my bloating get worse on Wednesdays?", the coach has the data to actually investigate that question — cross-referencing Wednesday meals against symptom timing across multiple weeks.

**Additional capabilities:**
- Streaming responses (answers appear word-by-word, not after a delay)
- Image upload — photograph a meal, supplement label, or restaurant menu for real-time analysis
- Thread management — named conversation threads with auto-generated titles, rename and delete
- **Save to Planner** — when the coach drafts a meal plan in conversation, a single click saves it to the weekly planner with conflict detection
- Markdown rendering — structured responses with headers, bullet points, and formatted tables
- In-app links — the coach can reference specific pages in the app contextually

The coach is tuned for an empathetic, encouraging tone — calibrated for users who may be dealing with chronic conditions, body image concerns, and years of frustration with the medical system.

---

### 4.5 AI Meal Planner
A full 7-day meal planning grid, generated and managed by AI:

- **Full week generation** — one click generates 21 meals (3/day × 7 days) personalized to the user's dietary restrictions, allergens, eating style, and macro targets
- **Individual slot swap** — regenerate any single meal without disrupting the rest of the week
- **Accept/reject workflow** — users review AI suggestions before committing
- **Manual editing** — any slot can be edited or cleared
- **Coach integration** — meal plans created in coach conversation can be pushed directly to the planner

The planner is not a static recipe database. Every meal is generated fresh for the user's specific profile.

---

### 4.6 Insights & Correlations
A 30-day analytical dashboard surfacing patterns the user could never find manually:

**Gut Score Trend** — 30-day SVG line chart with date labels and score milestones

**Weight Trend** — 90-day line chart with delta from start

**Symptom Frequency** — ranked list of most common symptoms with occurrence counts

**Food-Symptom Correlations** — the most differentiated feature in the product:
- The system cross-references meal logs against symptom logs, controlling for timing (onset minutes after eating)
- Surfaces specific foods or ingredients that statistically correlate with higher symptom severity
- Presented as a ranked table: food → associated symptoms → correlation strength
- AI-generated narrative summarizing the patterns in plain English, with specific dietary modifications

**Lab Results tab** — structured area for users to log blood work, colonoscopy notes, or test results for reference alongside their behavioral data

---

### 4.7 Eat Out Safely
A real-time menu analyzer for dining out — one of the most requested features in gut health communities:

- **Photo mode:** Point the camera at a physical menu, take a photo, and the AI analyzes every item against the user's personal trigger profile
- **Search mode:** Type a restaurant name and the AI uses its knowledge of typical menu items
- Results are organized into three tiers: **Safe**, **Caution**, **Avoid**
- Each item includes a plain-English explanation of why it's flagged (e.g., "contains dairy — your top reported trigger")
- Ordering tips for each caution item ("ask for sauce on the side," "request gluten-free bread")
- HEIC photo support for iPhone users
- Mobile-first design with rear camera capture

This feature addresses one of the most anxiety-inducing aspects of living with a GI condition — eating out — and gives users real confidence backed by their own data.

---

### 4.8 Doctor Report
A printable, clinically-structured PDF report designed for gastroenterologist visits:

- **30-day gut score trend** with SVG chart
- **Symptom frequency table** with severity averages
- **Bristol Stool distribution chart** showing stool type patterns over 90 days
- **Nutrition averages** — daily calorie, protein, fat, carb intake
- **Weight trend** with delta
- **Top food-symptom correlations** — the data the doctor actually needs
- **AI-generated clinical narrative** — a structured, professional summary written in clinical language, ready to hand to a specialist

This bridges the gap between the patient's daily experience and the 15-minute clinical appointment. Instead of "I've been feeling bad," the patient walks in with 30 days of quantified longitudinal data and a professional narrative summary.

---

## 5. BUSINESS MODEL

### Subscription Tiers (Stripe-powered, monthly recurring)

| Tier | Price | Details |
|------|-------|---------|
| **Founding Member** | $13/mo | Capped at 200 members — early adopter pricing, never increases |
| **Launch** | $20/mo | Standard access, launch window pricing |
| **Standard** | $25/mo | Full access, ongoing pricing |

All plans include a **7-day free trial** — no credit card friction at signup.

### Unit Economics
- **Average Revenue Per User (ARPU):** ~$20/mo at current plan mix
- **Annual Contract Value:** ~$240/user
- **Low churn incentive:** The longer a user stays, the more personalized and valuable the product becomes — data lock-in through utility, not friction

### Revenue Expansion Opportunities
- **B2B / Employer benefits** — chronic GI conditions cost employers significantly in productivity and healthcare costs; GutHub as a covered benefit
- **Clinical partnerships** — gastroenterology practices licensing GutHub for patient panels
- **Insurance partnerships** — reimbursable digital therapeutic model (DTx) pathway
- **Telehealth integration** — connecting users to registered dietitians or GI specialists directly within the platform
- **Research data licensing** — anonymized, aggregated longitudinal gut health data is extraordinarily valuable to pharmaceutical and nutrition research companies

---

## 6. TECHNOLOGY

This section is designed to demonstrate the engineering maturity and scalability of the platform.

### Architecture Overview

GutHub is built on a modern, production-grade full-stack architecture — the same foundational stack used by companies like Vercel, Linear, and Notion.

```
User Browser / Mobile Browser
        ↓
   Vercel Edge Network (CDN + serverless)
        ↓
   Next.js 16 App Router (React 19, TypeScript)
        ↓
   ┌─────────────────┬──────────────────┐
   │   Supabase      │   OpenAI API     │
   │  (Postgres DB   │  (GPT-5 Mini     │
   │   + Auth        │   Vision Model)  │
   │   + Storage)    │                  │
   └─────────────────┴──────────────────┘
        ↓
   Stripe (billing)   Resend (email)
```

### Technology Stack — In Depth

**Frontend: Next.js 16 with React 19**
Next.js is the gold-standard React framework, used in production by OpenAI, TikTok, Twitch, and thousands of enterprise companies. Version 16 with the App Router enables:
- **Server-side rendering (SSR)** — pages render on the server before reaching the browser, meaning faster load times, better SEO, and no blank loading screens
- **React Server Components** — complex data fetching happens server-side, reducing client-side JavaScript by up to 60%
- **Streaming** — the AI coach streams responses token-by-token using Server-Sent Events (SSE), creating the "typing" experience without polling
- **Turbopack** — next-generation bundler replacing Webpack, delivering 10x faster build times

React 19 includes concurrent rendering, automatic batching, and the new `use` hook for async data — the leading edge of frontend performance.

**TypeScript** — the entire codebase is strongly typed, reducing runtime errors and making the system far easier to maintain and scale as the team grows. Industry standard for production-grade applications.

**Backend: Supabase (PostgreSQL)**
Supabase is the open-source Firebase alternative, built on PostgreSQL — the world's most trusted relational database.

- **18 interconnected tables** managing the full user data model: profiles, meal logs, symptom logs, BM logs, water logs, weight logs, gut scores, meal plan slots, coach threads, messages, correlations, macro targets, and more
- **Row Level Security (RLS)** — database-enforced access control ensures users can only ever access their own data. This is enforced at the database level, not just the application level — a security guarantee that matters to enterprise and clinical partners
- **Real-time subscriptions** — the database can push live updates to connected clients
- **Supabase Auth** — enterprise-grade authentication supporting email/password, Google OAuth, magic links, and SSO — all session management handled by battle-tested infrastructure
- **Supabase Storage** — secure file storage for meal photos with CDN delivery

**AI Layer: OpenAI**
The AI coach runs on `gpt-5-mini-2025-08-07` — OpenAI's latest efficient model offering near-GPT-4 quality at substantially lower latency and cost.

Key AI implementation details:
- **Streaming inference** — responses stream token-by-token via SSE, eliminating the perceived wait time for complex queries
- **Vision model** — meal photo analysis and menu scanning use a multimodal model capable of identifying food items, portion sizes, and ingredients from images
- **Context injection** — a purpose-built context builder (`lib/coach-context.ts`) assembles the user's full health profile, recent logs, meal plan, and symptom history into a structured prompt on every request. The AI never gives generic advice because it always has specific, current data
- **System prompt engineering** — the coach's tone, clinical accuracy, and safety guardrails are maintained through a carefully engineered system prompt tuned for GI health guidance

**Infrastructure: Vercel**
Vercel is the deployment platform behind Next.js (they're the same company). Production deployment characteristics:
- **Global edge network** — requests are served from the nearest of 100+ data centers worldwide, minimizing latency regardless of user location
- **Serverless functions** — API routes scale automatically from zero to millions of requests with no infrastructure management
- **Automatic CI/CD** — every push to the main branch triggers a production deployment in ~90 seconds
- **Zero downtime deployments** — new versions go live without interrupting active users
- **99.99% uptime SLA** on the Pro plan

**Payments: Stripe**
Stripe processes payments for Amazon, Google, Shopify, and Lyft. For GutHub:
- Subscription billing with automatic renewal, proration, and failed payment recovery
- 7-day trial periods with automatic conversion
- Customer Portal — users can upgrade, downgrade, or cancel without touching our support team
- Webhook-driven subscription sync — Stripe events are processed in real time and reflected immediately in the user's access tier
- Live mode with restricted API keys — production-grade from day one

**Email: Resend**
Transactional email infrastructure for auth confirmations, password resets, and lifecycle communications.

**Domain Architecture**
- `www.guthub.ai` — marketing site (homepage, features, pricing, about)
- `app.guthub.ai` — full application
- `/admin` — internal admin panel (password-protected) with real-time metrics across users, revenue, and feature adoption
- Shared authentication session across both subdomains via `.guthub.ai` cookie domain

### Security Architecture

Security is a first-class concern given the sensitivity of health data:

- **Row Level Security** — Supabase RLS policies enforce user data isolation at the database layer. No application-layer bug can expose another user's data
- **HttpOnly cookies** — session tokens are never accessible to JavaScript, preventing XSS token theft
- **Service Role isolation** — admin operations that bypass RLS use a separate service role key never exposed to the client
- **No PHI stored** — GutHub stores behavioral health data (logs, scores, patterns) but not Protected Health Information in the HIPAA definition — positioning for a compliant path as the platform scales
- **Stripe restricted keys** — payment operations use scoped API keys with minimum required permissions
- **Environment variable separation** — zero secrets in the codebase; all credentials in Vercel's encrypted environment store

### Scalability

The architecture was designed to scale without rearchitecting:

- **Stateless API layer** — Vercel serverless functions scale horizontally with zero configuration
- **PostgreSQL with connection pooling** — Supabase handles connection pooling via PgBouncer, supporting thousands of concurrent database connections
- **CDN-cached static assets** — all static content (images, fonts, JS bundles) served from edge with multi-region caching
- **AI cost management** — using `gpt-5-mini` (not GPT-4) for cost efficiency without meaningful quality loss for the use case; easily upgradable per user tier

The current infrastructure can serve **50,000–100,000 monthly active users** without any architectural changes. Scaling beyond that is a configuration and cost decision, not an engineering problem.

---

## 7. COMPETITIVE LANDSCAPE

| | GutHub | MyFitnessPal | Cara Care | Nerva | Generic AI Chatbot |
|---|---|---|---|---|---|
| GI-specific | ✅ | ❌ | ✅ | ✅ (IBS only) | ❌ |
| AI coaching | ✅ Full context | ❌ | Limited | ❌ | ✅ No context |
| Food-symptom correlation | ✅ Automated | ❌ Manual | ✅ Basic | ❌ | ❌ |
| Meal planning (AI) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Doctor report | ✅ Clinical PDF | ❌ | Basic | ❌ | ❌ |
| Eat out analysis | ✅ Photo-based | ❌ | ❌ | ❌ | ❌ |
| Bristol scale tracking | ✅ | ❌ | ✅ | ✅ | ❌ |
| Personalized onboarding | ✅ Deep | Basic | Basic | ✅ | ❌ |

**GutHub's defensible differentiation:**
1. **Depth of AI context** — no competitor passes the user's full health history into every AI interaction
2. **End-to-end workflow** — logging → correlation → coaching → meal planning → doctor report in a single product
3. **Eat Out feature** — real-time, photo-based menu analysis against a personal trigger profile has no direct equivalent in the market
4. **Data flywheel** — the more users log, the better the correlations; the better the correlations, the more valuable the coaching; the more valuable the coaching, the lower the churn

---

## 8. TRACTION & VALIDATION

*(To be populated with live metrics as the platform scales)*

- Live at app.guthub.ai
- Stripe live-mode payments active — real subscribers from day one
- Founding Member tier capped at 200 — manufactured scarcity creating urgency
- Admin dashboard tracking real-time MRR, user growth, feature adoption, and symptom data signals

---

## 9. THE ROADMAP

### Near Term (0–6 months)
- Mobile app (iOS/Android) via React Native or Progressive Web App
- Push notifications for logging reminders and streak tracking
- Integration with Apple Health and Google Fit for passive data (steps, sleep, HRV)
- Registered Dietitian marketplace — connect users to vetted GI-specialized RDs for 1:1 sessions
- Community features — anonymous community boards by condition type

### Medium Term (6–18 months)
- B2B employer benefits program
- Clinical partnership program — white-label GutHub for gastroenterology practices
- Wearable integration (Oura Ring, Whoop) — correlate HRV, sleep data with gut symptoms
- HIPAA Business Associate Agreement (BAA) capability for clinical deployments
- Multilingual support — Spanish, French, German

### Long Term (18+ months)
- Research data platform — anonymized, consented longitudinal dataset licensing to pharma and nutrition research
- Insurance reimbursement pathway — DTx (Digital Therapeutic) FDA clearance track
- GutHub for Clinicians — a practitioner-facing dashboard to monitor patient panels

---

## 10. WHY INVEST IN GUTHUB

**The problem is massive and underserved.** 70 million Americans with GI conditions, $136 billion in annual costs, and no adequate digital solution.

**The timing is perfect.** AI capabilities have just crossed the threshold where personalized health coaching is genuinely useful. The infrastructure (OpenAI, Supabase, Stripe) that makes this possible at a startup's budget didn't exist 3 years ago.

**The product is built.** This is not a pitch for an idea. GutHub is live, accepting real payments, and generating real MRR today. The engineering is production-grade and the architecture scales.

**The data flywheel is real.** Every user who logs makes the correlation engine smarter. Every correlation makes the coaching better. Every coaching interaction deepens engagement. This creates compounding retention that generic health apps cannot replicate.

**The market expands itself.** GLP-1 drugs have created 30 million new patients hyper-focused on gut and metabolic health. Every new Ozempic prescription is a potential GutHub user.

**Multiple monetization vectors.** Direct-to-consumer subscription is just the foundation. B2B, clinical, insurance, and research pathways represent 10x+ revenue opportunities on the same data and product infrastructure.

---

*GutHub — Finally, a gut health companion that knows you.*
*www.guthub.ai*

---
*Document prepared for investor reference. All technical details reflect the current production system.*
