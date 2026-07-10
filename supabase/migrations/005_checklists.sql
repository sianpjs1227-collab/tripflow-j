-- TripFlow J — checklists 테이블 (Supabase SQL Editor에서 실행)

create extension if not exists "pgcrypto";

create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checklists_trip_id_idx on public.checklists (trip_id);
create index if not exists checklists_sort_order_idx
  on public.checklists (trip_id, sort_order);

alter table public.checklists enable row level security;

drop policy if exists "checklists_select_own" on public.checklists;
drop policy if exists "checklists_insert_own" on public.checklists;
drop policy if exists "checklists_update_own" on public.checklists;
drop policy if exists "checklists_delete_own" on public.checklists;

create policy "checklists_select_own"
  on public.checklists
  for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = checklists.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "checklists_insert_own"
  on public.checklists
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = checklists.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "checklists_update_own"
  on public.checklists
  for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = checklists.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = checklists.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "checklists_delete_own"
  on public.checklists
  for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = checklists.trip_id
        and trips.user_id = auth.uid()
    )
  );
