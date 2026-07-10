-- TripFlow J — expenses 테이블 (Supabase SQL Editor에서 실행)

create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  itinerary_id uuid references public.itineraries (id) on delete set null,
  category text not null check (
    category in ('transport', 'food', 'cafe', 'shopping', 'other')
  ),
  title text not null,
  amount double precision not null check (amount >= 0),
  currency text not null,
  krw_amount double precision,
  paid_by text not null default 'me',
  memo text,
  spent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expenses_trip_id_idx on public.expenses (trip_id);
create index if not exists expenses_itinerary_id_idx on public.expenses (itinerary_id);
create index if not exists expenses_spent_at_idx on public.expenses (spent_at desc);
create index if not exists expenses_category_idx on public.expenses (category);

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_own"
  on public.expenses
  for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "expenses_insert_own"
  on public.expenses
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "expenses_update_own"
  on public.expenses
  for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "expenses_delete_own"
  on public.expenses
  for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = expenses.trip_id
        and trips.user_id = auth.uid()
    )
  );
