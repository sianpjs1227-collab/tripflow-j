-- TripFlow J — places.is_hidden (My Maps/KML soft-hide)
-- Google My Maps 원본은 유지하고 TripFlow 목록에서만 숨긴다.

alter table public.places
  add column if not exists is_hidden boolean not null default false;
