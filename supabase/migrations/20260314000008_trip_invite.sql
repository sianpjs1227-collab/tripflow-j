-- TripFlow J — trip invite by email
-- Owner invites Google-authenticated users as editor

-- Look up auth user by email (client cannot read auth.users)
create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id
  from auth.users
  where lower(email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.find_user_id_by_email(text) from public;
grant execute on function public.find_user_id_by_email(text) to authenticated;

-- Invite flow: owner-only, editor role, duplicate-safe
create or replace function public.invite_trip_member_by_email(
  p_trip_id uuid,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text := lower(trim(p_email));
  v_invitee_id uuid;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  if v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'code', 'invalid_email');
  end if;

  if not public.is_trip_owner(p_trip_id) then
    return jsonb_build_object('ok', false, 'code', 'not_owner');
  end if;

  select id into v_invitee_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_invitee_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if exists (
    select 1
    from public.trip_members
    where trip_id = p_trip_id
      and user_id = v_invitee_id
  ) then
    return jsonb_build_object('ok', false, 'code', 'already_member');
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (p_trip_id, v_invitee_id, 'editor');

  return jsonb_build_object(
    'ok', true,
    'code', 'invited',
    'user_id', v_invitee_id,
    'role', 'editor'
  );
end;
$$;

revoke all on function public.invite_trip_member_by_email(uuid, text) from public;
grant execute on function public.invite_trip_member_by_email(uuid, text) to authenticated;

-- Owners can read all members of their trip (duplicate checks / future UI)
drop policy if exists "trip_members_select_own" on public.trip_members;
drop policy if exists "trip_members_select_member" on public.trip_members;

create policy "trip_members_select_member"
  on public.trip_members
  for select
  using (
    auth.uid() = user_id
    or public.is_trip_owner(trip_id)
  );

-- Owners can insert members (invite); keep self-owner bootstrap
drop policy if exists "trip_members_insert_owner" on public.trip_members;
drop policy if exists "trip_members_insert_self_owner" on public.trip_members;
drop policy if exists "trip_members_insert_by_owner" on public.trip_members;

create policy "trip_members_insert_self_owner"
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

create policy "trip_members_insert_by_owner"
  on public.trip_members
  for insert
  with check (public.is_trip_owner(trip_id));
