-- TripFlow J — trip_invites (link-based sharing)

create extension if not exists "pgcrypto";

create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  token text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trip_invites_trip_id_idx
  on public.trip_invites (trip_id);

create index if not exists trip_invites_token_idx
  on public.trip_invites (token);

create index if not exists trip_invites_expires_at_idx
  on public.trip_invites (expires_at);

alter table public.trip_invites enable row level security;

drop policy if exists "trip_invites_select_owner" on public.trip_invites;
drop policy if exists "trip_invites_insert_owner" on public.trip_invites;
drop policy if exists "trip_invites_delete_owner" on public.trip_invites;

create policy "trip_invites_select_owner"
  on public.trip_invites
  for select
  using (public.is_trip_owner(trip_id));

create policy "trip_invites_insert_owner"
  on public.trip_invites
  for insert
  with check (
    auth.uid() = created_by
    and public.is_trip_owner(trip_id)
  );

create policy "trip_invites_delete_owner"
  on public.trip_invites
  for delete
  using (public.is_trip_owner(trip_id));

-- Preview invite by token (works before membership)
create or replace function public.get_trip_invite_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_invite public.trip_invites%rowtype;
  v_trip public.trips%rowtype;
  v_owner auth.users%rowtype;
  v_owner_name text;
  v_expired boolean;
  v_already_member boolean := false;
begin
  select * into v_invite
  from public.trip_invites
  where token = trim(p_token)
  limit 1;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  v_expired := v_invite.expires_at <= now();

  select * into v_trip
  from public.trips
  where id = v_invite.trip_id;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'trip_missing');
  end if;

  select * into v_owner
  from auth.users
  where id = v_trip.user_id;

  v_owner_name := coalesce(
    nullif(v_owner.raw_user_meta_data->>'full_name', ''),
    nullif(v_owner.raw_user_meta_data->>'name', ''),
    nullif(v_owner.raw_user_meta_data->>'display_name', ''),
    v_owner.email,
    '여행 소유자'
  );

  if auth.uid() is not null then
    v_already_member := exists (
      select 1
      from public.trip_members
      where trip_id = v_invite.trip_id
        and user_id = auth.uid()
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', 'ok',
    'trip_id', v_trip.id,
    'title', v_trip.title,
    'country', v_trip.country,
    'city', v_trip.city,
    'owner_name', v_owner_name,
    'expires_at', v_invite.expires_at,
    'expired', v_expired,
    'already_member', v_already_member
  );
end;
$$;

revoke all on function public.get_trip_invite_preview(text) from public;
grant execute on function public.get_trip_invite_preview(text) to anon, authenticated;

-- Accept invite → add editor membership
create or replace function public.accept_trip_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_invite public.trip_invites%rowtype;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'code', 'not_authenticated');
  end if;

  select * into v_invite
  from public.trip_invites
  where token = trim(p_token)
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'not_found');
  end if;

  if v_invite.expires_at <= now() then
    return jsonb_build_object('ok', false, 'code', 'expired');
  end if;

  if exists (
    select 1
    from public.trip_members
    where trip_id = v_invite.trip_id
      and user_id = v_user_id
  ) then
    update public.trip_invites
    set used_at = coalesce(used_at, now())
    where id = v_invite.id;

    return jsonb_build_object(
      'ok', true,
      'code', 'already_member',
      'trip_id', v_invite.trip_id
    );
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_invite.trip_id, v_user_id, 'editor');

  update public.trip_invites
  set used_at = now()
  where id = v_invite.id;

  return jsonb_build_object(
    'ok', true,
    'code', 'joined',
    'trip_id', v_invite.trip_id,
    'role', 'editor'
  );
end;
$$;

revoke all on function public.accept_trip_invite(text) from public;
grant execute on function public.accept_trip_invite(text) to authenticated;
