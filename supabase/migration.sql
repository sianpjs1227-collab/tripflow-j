-- TripFlow J
-- Supabase SQL Editor에서 한 번에 실행하는 통합 마이그레이션
-- 생성 대상: trips, places, itineraries

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

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  name text not null,
  address text,
  latitude double precision,
  longitude double precision,
  category text not null check (
    category in (
      'accommodation',
      'restaurant_bar',
      'cafe_dessert',
      'shopping',
      'sightseeing',
      'other'
    )
  ),
  memo text,
  visited boolean not null default false,
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create index if not exists trips_user_id_idx
  on public.trips (user_id);

create index if not exists places_trip_id_idx
  on public.places (trip_id);

create index if not exists itineraries_trip_id_idx
  on public.itineraries (trip_id);

create index if not exists itineraries_place_id_idx
  on public.itineraries (place_id);

alter table public.trips enable row level security;
alter table public.places enable row level security;
alter table public.itineraries enable row level security;

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

drop policy if exists "places_select_own" on public.places;
drop policy if exists "places_insert_own" on public.places;
drop policy if exists "places_update_own" on public.places;
drop policy if exists "places_delete_own" on public.places;

create policy "places_select_own"
  on public.places
  for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = places.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "places_insert_own"
  on public.places
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = places.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "places_update_own"
  on public.places
  for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = places.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = places.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "places_delete_own"
  on public.places
  for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = places.trip_id
        and trips.user_id = auth.uid()
    )
  );

drop policy if exists "itineraries_select_own" on public.itineraries;
drop policy if exists "itineraries_insert_own" on public.itineraries;
drop policy if exists "itineraries_update_own" on public.itineraries;
drop policy if exists "itineraries_delete_own" on public.itineraries;

create policy "itineraries_select_own"
  on public.itineraries
  for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_insert_own"
  on public.itineraries
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_update_own"
  on public.itineraries
  for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "itineraries_delete_own"
  on public.itineraries
  for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = itineraries.trip_id
        and trips.user_id = auth.uid()
    )
  );
