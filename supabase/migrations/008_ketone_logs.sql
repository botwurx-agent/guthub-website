-- Ketone log table — blood ketone tracking for keto/metabolic users
create table if not exists public.ketone_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  ketone_mmol   numeric(4,2) not null,      -- mmol/L value e.g. 1.5
  method        text default 'blood',        -- 'blood' | 'urine' | 'breath'
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists ketone_logs_user_date_idx on public.ketone_logs (user_id, log_date);

alter table public.ketone_logs enable row level security;

create policy "ketone_logs_own" on public.ketone_logs for all using (auth.uid() = user_id);
