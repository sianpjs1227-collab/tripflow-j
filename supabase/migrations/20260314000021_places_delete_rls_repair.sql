-- TripFlow J — places DELETE RLS repair
--
-- Symptom:
--   SELECT (precheck) finds the row
--   DELETE returns 0 rows, no PostgREST error (DELETE_ZERO_ROWS)
--
-- Cause (typical):
--   1) places DELETE policy missing on remote (RLS default deny → 0 rows)
--   2) SELECT uses is_trip_member (viewer OK) but DELETE uses can_edit_trip
--      (owner/editor or trips.user_id only) → viewer can see but not delete
--   3) trip creator missing trip_members owner row → can_edit_trip false
--      even when they can still SELECT via a stale/partial membership
--
-- places has no owner / created_by column.
-- DELETE is gated by trip_id → can_edit_trip(trip_id).

-- ---------------------------------------------------------------------------
-- 1) Ensure helper functions
-- ---------------------------------------------------------------------------
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

create or replace function public.can_edit_trip(p_trip_id uuid)
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
      and role in ('owner', 'editor')
  )
  or exists (
    select 1
    from public.trips
    where id = p_trip_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_trip_member(uuid) from public;
revoke all on function public.can_edit_trip(uuid) from public;
grant execute on function public.is_trip_member(uuid) to authenticated;
grant execute on function public.can_edit_trip(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Backfill: trip creator must be trip_members.owner
-- ---------------------------------------------------------------------------
insert into public.trip_members (trip_id, user_id, role)
select t.id, t.user_id, 'owner'
from public.trips t
where t.user_id is not null
  and not exists (
    select 1
    from public.trip_members m
    where m.trip_id = t.id
      and m.user_id = t.user_id
  );

-- If creator exists as non-owner/editor (e.g. viewer), promote to owner
update public.trip_members m
set role = 'owner'
from public.trips t
where m.trip_id = t.id
  and m.user_id = t.user_id
  and m.role not in ('owner', 'editor');

-- ---------------------------------------------------------------------------
-- 3) Table privileges (RLS still applies)
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.places to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Recreate places RLS policies (idempotent)
-- ---------------------------------------------------------------------------
alter table public.places enable row level security;

drop policy if exists "places_select_own" on public.places;
drop policy if exists "places_insert_own" on public.places;
drop policy if exists "places_update_own" on public.places;
drop policy if exists "places_delete_own" on public.places;
drop policy if exists "places_select_member" on public.places;
drop policy if exists "places_insert_editor" on public.places;
drop policy if exists "places_update_editor" on public.places;
drop policy if exists "places_delete_editor" on public.places;

-- SELECT: any trip member (owner / editor / viewer)
create policy "places_select_member"
  on public.places
  for select
  to authenticated
  using (public.is_trip_member(trip_id));

-- INSERT/UPDATE/DELETE: owner or editor (or trips.user_id creator)
create policy "places_insert_editor"
  on public.places
  for insert
  to authenticated
  with check (public.can_edit_trip(trip_id));

create policy "places_update_editor"
  on public.places
  for update
  to authenticated
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "places_delete_editor"
  on public.places
  for delete
  to authenticated
  using (public.can_edit_trip(trip_id));

-- ---------------------------------------------------------------------------
-- 5) Diagnostic RPC — call from client before/after failed delete
-- ---------------------------------------------------------------------------
create or replace function public.debug_places_delete_access(p_place_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'auth_uid', auth.uid(),
    'place_id', p.id,
    'place_name', p.name,
    'trip_id', p.trip_id,
    'trips_user_id', t.user_id,
    'is_trip_owner_col', (t.user_id = auth.uid()),
    'is_trip_member', public.is_trip_member(p.trip_id),
    'can_edit_trip', public.can_edit_trip(p.trip_id),
    'member_role', m.role,
    'delete_should_work', public.can_edit_trip(p.trip_id)
  )
  from public.places p
  left join public.trips t on t.id = p.trip_id
  left join public.trip_members m
    on m.trip_id = p.trip_id
   and m.user_id = auth.uid()
  where p.id = p_place_id;
$$;

revoke all on function public.debug_places_delete_access(uuid) from public;
grant execute on function public.debug_places_delete_access(uuid) to authenticated;

comment on function public.debug_places_delete_access(uuid) is
  'Diagnose places DELETE RLS: member role, can_edit_trip, trips.user_id';
