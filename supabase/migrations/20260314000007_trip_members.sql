-- TripFlow J — trip_members
-- Shared trip membership foundation (owner / editor / viewer)
-- No invite UI in this step — DB + RLS + repository only

create extension if not exists "pgcrypto";

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create index if not exists trip_members_trip_id_idx
  on public.trip_members (trip_id);

create index if not exists trip_members_user_id_idx
  on public.trip_members (user_id);

create index if not exists trip_members_user_trip_idx
  on public.trip_members (user_id, trip_id);

-- Existing trips → creator as owner (idempotent backfill)
insert into public.trip_members (trip_id, user_id, role)
select t.id, t.user_id, 'owner'
from public.trips t
where not exists (
  select 1
  from public.trip_members m
  where m.trip_id = t.id
    and m.user_id = t.user_id
);

-- Avoid RLS recursion between trips ↔ trip_members
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and role = 'owner'
  )
  or exists (
    select 1
    from public.trips
    where id = p_trip_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
revoke all on function public.is_trip_owner(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.is_trip_owner(uuid) to authenticated;

alter table public.trip_members enable row level security;

drop policy if exists "trip_members_select_own" on public.trip_members;
drop policy if exists "trip_members_insert_owner" on public.trip_members;
drop policy if exists "trip_members_update_owner" on public.trip_members;
drop policy if exists "trip_members_delete_owner" on public.trip_members;

-- Members can read their own membership rows (no trips join → no recursion)
create policy "trip_members_select_own"
  on public.trip_members
  for select
  using (auth.uid() = user_id);

-- Creator can register themselves as owner when they own the trip row
create policy "trip_members_insert_owner"
  on public.trip_members
  for insert
  with check (
    auth.uid() = user_id
    and role = 'owner'
    and exists (
      select 1
      from public.trips
      where trips.id = trip_members.trip_id
        and trips.user_id = auth.uid()
    )
  );

-- Only trip owners manage membership rows (future invite/remove)
create policy "trip_members_update_owner"
  on public.trip_members
  for update
  using (public.is_trip_owner(trip_id))
  with check (public.is_trip_owner(trip_id));

create policy "trip_members_delete_owner"
  on public.trip_members
  for delete
  using (public.is_trip_owner(trip_id));

-- Trips: membership-based select; owner keeps write/delete
drop policy if exists "trips_select_own" on public.trips;
drop policy if exists "trips_select_member" on public.trips;
drop policy if exists "trips_update_own" on public.trips;
drop policy if exists "trips_delete_own" on public.trips;

create policy "trips_select_member"
  on public.trips
  for select
  using (public.is_trip_member(id));

create policy "trips_update_own"
  on public.trips
  for update
  using (public.is_trip_owner(id))
  with check (public.is_trip_owner(id));

create policy "trips_delete_own"
  on public.trips
  for delete
  using (public.is_trip_owner(id));

-- trips_insert_own stays: auth.uid() = user_id
