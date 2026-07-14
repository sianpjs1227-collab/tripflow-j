-- TripFlow J — itineraries.start_time nullable (시간 미정 일정)
alter table public.itineraries
  alter column start_time drop not null;

comment on column public.itineraries.start_time is
  'HH:mm — null means time undetermined (시간 미정)';
