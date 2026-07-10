-- TripFlow J — places
-- supabase migration: create places table + RLS

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

create index if not exists places_trip_id_idx on public.places (trip_id);

alter table public.places enable row level security;

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
