-- TripFlow J — repair: itineraries.start_time must allow NULL (시간 미정)
-- 000014 미적용 환경에서도 안전하게 재실행 가능

do $$
declare
  is_not_null boolean;
begin
  select (c.is_nullable = 'NO')
    into is_not_null
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'itineraries'
    and c.column_name = 'start_time';

  if is_not_null then
    alter table public.itineraries
      alter column start_time drop not null;
    raise notice 'itineraries.start_time: dropped NOT NULL';
  else
    raise notice 'itineraries.start_time: already nullable';
  end if;
end $$;

comment on column public.itineraries.start_time is
  'HH:mm — null (or empty) means time undetermined (시간 미정)';
