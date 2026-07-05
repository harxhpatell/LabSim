-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  experiment text not null,
  code text,
  result_data jsonb,
  viva_score int,
  viva_total int,
  created_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

-- Each student can only see and insert their own attempts.
create policy "Users can view their own attempts"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own attempts"
  on public.attempts for insert
  with check (auth.uid() = user_id);
