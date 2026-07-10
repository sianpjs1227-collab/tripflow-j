-- TripFlow J — detail tables RLS via trip_members
-- Fixes empty places.select for shared members → false places.migrate

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

revoke all on function public.can_edit_trip(uuid) from public;
grant execute on function public.can_edit_trip(uuid) to authenticated;

-- places
drop policy if exists "places_select_own" on public.places;
drop policy if exists "places_insert_own" on public.places;
drop policy if exists "places_update_own" on public.places;
drop policy if exists "places_delete_own" on public.places;

create policy "places_select_member"
  on public.places for select
  using (public.is_trip_member(trip_id));

create policy "places_insert_editor"
  on public.places for insert
  with check (public.can_edit_trip(trip_id));

create policy "places_update_editor"
  on public.places for update
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "places_delete_editor"
  on public.places for delete
  using (public.can_edit_trip(trip_id));

-- itineraries
drop policy if exists "itineraries_select_own" on public.itineraries;
drop policy if exists "itineraries_insert_own" on public.itineraries;
drop policy if exists "itineraries_update_own" on public.itineraries;
drop policy if exists "itineraries_delete_own" on public.itineraries;

create policy "itineraries_select_member"
  on public.itineraries for select
  using (public.is_trip_member(trip_id));

create policy "itineraries_insert_editor"
  on public.itineraries for insert
  with check (public.can_edit_trip(trip_id));

create policy "itineraries_update_editor"
  on public.itineraries for update
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "itineraries_delete_editor"
  on public.itineraries for delete
  using (public.can_edit_trip(trip_id));

-- expenses
drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_member"
  on public.expenses for select
  using (public.is_trip_member(trip_id));

create policy "expenses_insert_editor"
  on public.expenses for insert
  with check (public.can_edit_trip(trip_id));

create policy "expenses_update_editor"
  on public.expenses for update
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "expenses_delete_editor"
  on public.expenses for delete
  using (public.can_edit_trip(trip_id));

-- checklists
drop policy if exists "checklists_select_own" on public.checklists;
drop policy if exists "checklists_insert_own" on public.checklists;
drop policy if exists "checklists_update_own" on public.checklists;
drop policy if exists "checklists_delete_own" on public.checklists;

create policy "checklists_select_member"
  on public.checklists for select
  using (public.is_trip_member(trip_id));

create policy "checklists_insert_editor"
  on public.checklists for insert
  with check (public.can_edit_trip(trip_id));

create policy "checklists_update_editor"
  on public.checklists for update
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "checklists_delete_editor"
  on public.checklists for delete
  using (public.can_edit_trip(trip_id));

-- memos
drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;

create policy "memos_select_member"
  on public.memos for select
  using (public.is_trip_member(trip_id));

create policy "memos_insert_editor"
  on public.memos for insert
  with check (public.can_edit_trip(trip_id));

create policy "memos_update_editor"
  on public.memos for update
  using (public.can_edit_trip(trip_id))
  with check (public.can_edit_trip(trip_id));

create policy "memos_delete_editor"
  on public.memos for delete
  using (public.can_edit_trip(trip_id));
