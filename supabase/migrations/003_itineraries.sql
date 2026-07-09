-- TripFlow J — itineraries 테이블 (Supabase SQL Editor에서 실행)

create extension if not exists "pgcrypto";

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  day_number integer not null check (day_number >= 1),
  start_time text not null,
  end_time text,
  title text not null,
  memo text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itineraries_trip_id_idx on public.itineraries (trip_id);
create index if not exists itineraries_place_id_idx on public.itineraries (place_id);

alter table public.itineraries enable row level security;

create policy "itineraries_select_own"
  on public.itineraries for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_insert_own"
  on public.itineraries for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_update_own"
  on public.itineraries for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_delete_own"
  on public.itineraries for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );
