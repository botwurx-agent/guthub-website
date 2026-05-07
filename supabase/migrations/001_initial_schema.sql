-- =============================================================
-- GuthubAI — Initial Schema Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- =============================================================
-- PROFILES
-- Extends Supabase auth.users (1:1)
-- =============================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  -- personal
  name            text,
  dob             date,
  gender          text check (gender in ('male','female','other','prefer_not_to_say')),
  -- biometrics (stored in metric: kg, cm)
  weight_kg       numeric(5,2),
  height_cm       numeric(5,2),
  starting_weight_kg numeric(5,2),   -- set once at onboarding, immutable after
  -- 24 profile fields from Flask (stored as jsonb for flexibility)
  health_profile  jsonb default '{}',
  -- diet + lifestyle
  diet_mode       text default 'default' check (diet_mode in (
    'default','keto','carnivore','paleo','vegan','wfpb',
    'gluten_free','low_fodmap','high_protein_low_carb','intermittent_fasting'
  )),
  -- conservative mode flags
  conservative_mode boolean default false,
  conservative_reasons text[] default '{}',
  -- sensitive flags (only flag names go to AI, never content)
  sensitive_flags text[] default '{}',
  -- subscription
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  subscription_status       text default 'trialing' check (subscription_status in (
    'trialing','active','past_due','canceled','incomplete'
  )),
  subscription_plan         text check (subscription_plan in ('founding','launch','standard')),
  trial_ends_at             timestamptz,
  trial_email_sent          boolean default false,
  -- onboarding
  onboarding_completed      boolean default false,
  onboarding_step           int default 0,
  profile_completed         boolean default false,
  -- metadata
  timezone                  text default 'UTC',
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- =============================================================
-- MEAL LOGS
-- =============================================================
create table public.meal_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  meal_type     text check (meal_type in ('breakfast','lunch','dinner','snack')),
  meal_name     text not null,
  ingredients   jsonb default '[]',
  directions    text,
  -- nutrition
  calories      numeric(7,2),
  protein_g     numeric(6,2),
  fat_g         numeric(6,2),
  carbs_g       numeric(6,2),
  sodium_mg     numeric(7,2),
  -- source
  source        text default 'manual' check (source in ('manual','ai_planned','photo_scan','accepted_plan')),
  image_path    text,
  created_at    timestamptz default now()
);

-- =============================================================
-- SYMPTOM LOGS
-- =============================================================
create table public.symptom_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  symptom_type  text not null,   -- bloating, gas, cramping, nausea, reflux, etc.
  severity      int not null check (severity between 1 and 10),
  notes         text,
  created_at    timestamptz default now()
);

-- =============================================================
-- BOWEL MOVEMENT LOGS
-- =============================================================
create table public.bm_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  bristol_type  int not null check (bristol_type between 1 and 7),
  urgency       int check (urgency between 1 and 5),
  pain          int check (pain between 1 and 5),
  notes         text,
  created_at    timestamptz default now()
);

-- =============================================================
-- WEIGHT LOGS
-- =============================================================
create table public.weight_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  weight_kg     numeric(5,2) not null,
  created_at    timestamptz default now()
);

-- =============================================================
-- WATER LOGS
-- =============================================================
create table public.water_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  amount_ml     numeric(6,1) not null,
  created_at    timestamptz default now()
);

-- =============================================================
-- NOTE LOGS (free-text journal entries)
-- =============================================================
create table public.note_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  content       text not null,
  tags          text[] default '{}',
  created_at    timestamptz default now()
);

-- =============================================================
-- GUT SCORES (daily computed)
-- =============================================================
create table public.gut_scores (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  score_date    date not null,
  score         numeric(5,2) not null,
  -- score components for transparency
  base_score    numeric(5,2) default 100,
  symptom_penalty numeric(5,2) default 0,
  bm_penalty    numeric(5,2) default 0,
  calculation_notes text,
  created_at    timestamptz default now(),
  unique(user_id, score_date)
);

-- =============================================================
-- MACRO TARGETS (LLM-calculated TDEE)
-- =============================================================
create table public.macro_targets (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  target_date           date not null,
  total_calories        numeric(7,2),
  carbs_pct             numeric(5,2),
  carbs_g               numeric(6,2),
  protein_pct           numeric(5,2),
  protein_g             numeric(6,2),
  fat_pct               numeric(5,2),
  fat_g                 numeric(6,2),
  created_at            timestamptz default now(),
  unique(user_id, target_date)
);

-- =============================================================
-- DAILY RECORDS (weight + consumed macros snapshot per day)
-- =============================================================
create table public.daily_records (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  record_date     date not null,
  -- weight
  current_weight_kg numeric(5,2),
  goal_weight_kg    numeric(5,2),
  -- consumed (sum of meal_logs for the day — updated via trigger or API)
  calories_consumed  numeric(7,2) default 0,
  carbs_consumed_g   numeric(6,2) default 0,
  protein_consumed_g numeric(6,2) default 0,
  fat_consumed_g     numeric(6,2) default 0,
  water_ml           numeric(7,1) default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, record_date)
);

-- =============================================================
-- GOAL WEIGHT UPDATES (rate-limit: 2/month)
-- =============================================================
create table public.goal_weight_updates (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  month       text not null,   -- YYYY-MM
  count       int default 0,
  unique(user_id, month)
);

-- =============================================================
-- MEAL PLAN SLOTS (AI-generated meal plans)
-- =============================================================
create table public.meal_plan_slots (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  plan_date     date not null,
  meal_type     text not null check (meal_type in ('breakfast','lunch','dinner')),
  meal_name     text not null,
  ingredients   jsonb default '[]',
  directions    text,
  calories      numeric(7,2),
  protein_g     numeric(6,2),
  fat_g         numeric(6,2),
  carbs_g       numeric(6,2),
  accepted      boolean default false,
  created_at    timestamptz default now(),
  unique(user_id, plan_date, meal_type)
);

-- =============================================================
-- COACH THREADS (conversation sessions)
-- =============================================================
create table public.coach_threads (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =============================================================
-- COACH MESSAGES
-- =============================================================
create table public.coach_messages (
  id            uuid primary key default uuid_generate_v4(),
  thread_id     uuid not null references public.coach_threads(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          text not null check (role in ('user','assistant','system')),
  content       text not null,
  has_image     boolean default false,
  image_path    text,
  image_type    text,
  token_count   int,
  created_at    timestamptz default now()
);

-- =============================================================
-- INSIGHTS (AI-generated pattern insights)
-- =============================================================
create table public.insights (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  insight_type    text not null check (insight_type in (
    'correlation','trend','weekly_summary','goal_analysis','lab_finding'
  )),
  title           text not null,
  body            text not null,
  data_payload    jsonb default '{}',
  -- review workflow
  review_status   text default 'auto' check (review_status in ('auto','pending_review','approved','rejected')),
  reviewed_by     text,
  reviewed_at     timestamptz,
  -- display
  dismissed       boolean default false,
  read            boolean default false,
  created_at      timestamptz default now()
);

-- =============================================================
-- CORRELATIONS (symptom-food statistical findings)
-- =============================================================
create table public.correlations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  food_item       text not null,
  symptom_type    text not null,
  correlation_score numeric(5,4),   -- chi-square derived, 0-1
  occurrence_count int default 0,
  observation_days int default 0,
  llm_synthesis   text,
  computed_at     timestamptz default now(),
  unique(user_id, food_item, symptom_type)
);

-- =============================================================
-- HISTORICAL SUMMARIES (nightly AI context cache)
-- =============================================================
create table public.historical_summaries (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  summary_date  date not null,
  summary_text  text not null,
  token_count   int,
  created_at    timestamptz default now(),
  unique(user_id, summary_date)
);

-- =============================================================
-- LAB REPORTS
-- =============================================================
create table public.lab_reports (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  filename          text not null,
  storage_path      text not null,
  report_date       date,
  analysis_summary  text,
  report_data       jsonb default '{}',
  created_at        timestamptz default now()
);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  type        text default 'info' check (type in ('info','insight','reminder','alert')),
  read        boolean default false,
  created_at  timestamptz default now()
);

-- =============================================================
-- PUSH SUBSCRIPTIONS (VAPID web push)
-- =============================================================
create table public.push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null,
  keys        jsonb not null,   -- { p256dh, auth }
  created_at  timestamptz default now(),
  unique(user_id)
);

-- =============================================================
-- FOUNDING MEMBER COUNTER
-- Tracks cap of 200 founding plan slots
-- =============================================================
create table public.founding_counter (
  id      int primary key default 1 check (id = 1),   -- singleton row
  count   int default 0,
  cap     int default 200
);
insert into public.founding_counter (id, count, cap) values (1, 0, 200)
  on conflict (id) do nothing;

-- =============================================================
-- INDEXES
-- =============================================================
create index on public.meal_logs (user_id, log_date);
create index on public.symptom_logs (user_id, log_date);
create index on public.bm_logs (user_id, log_date);
create index on public.weight_logs (user_id, log_date);
create index on public.water_logs (user_id, log_date);
create index on public.gut_scores (user_id, score_date);
create index on public.daily_records (user_id, record_date);
create index on public.coach_messages (thread_id, created_at);
create index on public.coach_messages (user_id, created_at);
create index on public.insights (user_id, created_at);
create index on public.insights (user_id, review_status);
create index on public.correlations (user_id);
create index on public.lab_reports (user_id, created_at);
create index on public.notifications (user_id, read);

-- =============================================================
-- UPDATED_AT TRIGGER HELPER
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_daily_records_updated_at
  before update on public.daily_records
  for each row execute function public.set_updated_at();

create trigger set_coach_threads_updated_at
  before update on public.coach_threads
  for each row execute function public.set_updated_at();

-- =============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, trial_ends_at)
  values (
    new.id,
    now() + interval '7 days'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles              enable row level security;
alter table public.meal_logs             enable row level security;
alter table public.symptom_logs          enable row level security;
alter table public.bm_logs               enable row level security;
alter table public.weight_logs           enable row level security;
alter table public.water_logs            enable row level security;
alter table public.note_logs             enable row level security;
alter table public.gut_scores            enable row level security;
alter table public.macro_targets         enable row level security;
alter table public.daily_records         enable row level security;
alter table public.goal_weight_updates   enable row level security;
alter table public.meal_plan_slots       enable row level security;
alter table public.coach_threads         enable row level security;
alter table public.coach_messages        enable row level security;
alter table public.insights              enable row level security;
alter table public.correlations          enable row level security;
alter table public.historical_summaries  enable row level security;
alter table public.lab_reports           enable row level security;
alter table public.notifications         enable row level security;
alter table public.push_subscriptions    enable row level security;

-- Profiles: users can only see/update their own
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- All log tables: users own their rows
create policy "meal_logs_own"    on public.meal_logs    for all using (auth.uid() = user_id);
create policy "symptom_logs_own" on public.symptom_logs for all using (auth.uid() = user_id);
create policy "bm_logs_own"      on public.bm_logs      for all using (auth.uid() = user_id);
create policy "weight_logs_own"  on public.weight_logs  for all using (auth.uid() = user_id);
create policy "water_logs_own"   on public.water_logs   for all using (auth.uid() = user_id);
create policy "note_logs_own"    on public.note_logs    for all using (auth.uid() = user_id);

create policy "gut_scores_own"         on public.gut_scores         for all using (auth.uid() = user_id);
create policy "macro_targets_own"      on public.macro_targets       for all using (auth.uid() = user_id);
create policy "daily_records_own"      on public.daily_records       for all using (auth.uid() = user_id);
create policy "goal_weight_updates_own" on public.goal_weight_updates for all using (auth.uid() = user_id);
create policy "meal_plan_slots_own"    on public.meal_plan_slots     for all using (auth.uid() = user_id);

create policy "coach_threads_own"    on public.coach_threads    for all using (auth.uid() = user_id);
create policy "coach_messages_own"   on public.coach_messages   for all using (auth.uid() = user_id);

create policy "insights_own"             on public.insights             for all using (auth.uid() = user_id);
create policy "correlations_own"         on public.correlations         for all using (auth.uid() = user_id);
create policy "historical_summaries_own" on public.historical_summaries for all using (auth.uid() = user_id);
create policy "lab_reports_own"          on public.lab_reports          for all using (auth.uid() = user_id);
create policy "notifications_own"        on public.notifications        for all using (auth.uid() = user_id);
create policy "push_subscriptions_own"   on public.push_subscriptions   for all using (auth.uid() = user_id);

-- founding_counter: readable by all authenticated users, writable by service role only
create policy "founding_counter_read" on public.founding_counter
  for select using (true);

-- =============================================================
-- STORAGE BUCKETS
-- (Run these separately if needed — some Supabase plans require
--  bucket creation via the dashboard instead)
-- =============================================================
insert into storage.buckets (id, name, public) values
  ('meal-photos', 'meal-photos', false),
  ('lab-reports', 'lab-reports', false),
  ('chat-images', 'chat-images', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access their own files
-- Files are stored at {user_id}/{filename}
create policy "meal_photos_own" on storage.objects
  for all using (
    bucket_id = 'meal-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "lab_reports_own" on storage.objects
  for all using (
    bucket_id = 'lab-reports' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "chat_images_own" on storage.objects
  for all using (
    bucket_id = 'chat-images' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
