-- ============================================================================
-- Oops Money — Anonymous Bestie Benchmark (V3) — Supabase SQL
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query →
-- paste all of this → Run.
--
-- What it does (in plain terms):
--   * Makes a table `benchmark_stats` where each signed-in user has ONE row holding
--     only their spending PERCENTAGES per category-group (no amounts, no names).
--   * Turns on Row-Level Security so a user can only write/read THEIR OWN row.
--   * There is NO policy that lets anyone read other people's rows — so individual
--     data is private.
--   * Adds a function `benchmark_averages()` that returns ONLY the averages across
--     everyone (plus how many users are in the pool). The app calls this to compare.
-- ============================================================================

-- 1) The table: one anonymous row per user.
create table if not exists public.benchmark_stats (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  groups     jsonb not null default '{}'::jsonb,  -- { "Food": 35, "Beauty": 20, ... } percentages
  updated_at timestamptz not null default now()
);

-- 2) Lock it down with Row-Level Security.
alter table public.benchmark_stats enable row level security;

-- A user may insert / update / delete ONLY their own row.
-- (No SELECT policy on purpose → individual rows are not readable by anyone.)
drop policy if exists "own insert" on public.benchmark_stats;
create policy "own insert" on public.benchmark_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "own update" on public.benchmark_stats;
create policy "own update" on public.benchmark_stats
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own delete" on public.benchmark_stats;
create policy "own delete" on public.benchmark_stats
  for delete using (auth.uid() = user_id);

-- 3) The aggregate-only function. SECURITY DEFINER lets it read the whole table to
--    compute averages, but it ONLY ever returns aggregates — never a single user's row.
create or replace function public.benchmark_averages()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'sample', (select count(*) from public.benchmark_stats),
    'averages', coalesce((
      select jsonb_object_agg(key, avg_val)
      from (
        select key, round(avg(value::numeric), 0) as avg_val
        from public.benchmark_stats, jsonb_each_text(groups)
        group by key
      ) s
    ), '{}'::jsonb)
  );
$$;

-- Let the app (signed-in users) call the averages function.
grant execute on function public.benchmark_averages() to anon, authenticated;
