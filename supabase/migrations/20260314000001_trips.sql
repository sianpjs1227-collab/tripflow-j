-- TripFlow J — trips
-- supabase migration: create trips table + RLS

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  country text not null,
  city text not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('PLANNING', 'TRAVELING', 'COMPLETED')),
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips (user_id);

alter table public.trips enable row level security;

drop policy if exists "trips_select_own" on public.trips;
drop policy if exists "trips_insert_own" on public.trips;
drop policy if exists "trips_update_own" on public.trips;
drop policy if exists "trips_delete_own" on public.trips;

create policy "trips_select_own"
  on public.trips
  for select
  using (auth.uid() = user_id);

create policy "trips_insert_own"
  on public.trips
  for insert
  with check (auth.uid() = user_id);

create policy "trips_update_own"
  on public.trips
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "trips_delete_own"
  on public.trips
  for delete
  using (auth.uid() = user_id);
