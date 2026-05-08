-- Supplement log table — dedicated structured tracking (founding-member feature)
create table if not exists public.supplement_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  logged_at     timestamptz not null default now(),
  log_date      date not null,
  name          text not null,
  dose          text,
  with_food     boolean default false,
  notes         text,
  created_at    timestamptz default now()
);

create index if not exists supplement_logs_user_date_idx on public.supplement_logs (user_id, log_date);

alter table public.supplement_logs enable row level security;

create policy "supplement_logs_own" on public.supplement_logs for all using (auth.uid() = user_id);
