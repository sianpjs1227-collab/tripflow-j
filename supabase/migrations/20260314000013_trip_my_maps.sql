-- TripFlow J — trips.my_maps (Google My Maps 연결)
alter table public.trips
  add column if not exists my_maps_map_id text,
  add column if not exists my_maps_viewer_url text;

comment on column public.trips.my_maps_map_id is 'Google My Maps map id (mid)';
comment on column public.trips.my_maps_viewer_url is 'Google My Maps viewer/share URL';
