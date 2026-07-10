-- TripFlow J — memos
-- supabase migration: create memos table + RLS

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists memos_trip_id_idx on public.memos (trip_id);
create index if not exists memos_updated_at_idx
  on public.memos (trip_id, updated_at desc);

alter table public.memos enable row level security;

drop policy if exists "memos_select_own" on public.memos;
drop policy if exists "memos_insert_own" on public.memos;
drop policy if exists "memos_update_own" on public.memos;
drop policy if exists "memos_delete_own" on public.memos;

create policy "memos_select_own"
  on public.memos
  for select
  using (
    exists (
      select 1
      from public.trips
      where trips.id = memos.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "memos_insert_own"
  on public.memos
  for insert
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = memos.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "memos_update_own"
  on public.memos
  for update
  using (
    exists (
      select 1
      from public.trips
      where trips.id = memos.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = memos.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "memos_delete_own"
  on public.memos
  for delete
  using (
    exists (
      select 1
      from public.trips
      where trips.id = memos.trip_id
        and trips.user_id = auth.uid()
    )
  );
