-- TripFlow J — places.is_hidden repair
-- 원인: 코드는 is_hidden 을 insert/update 에 포함하지만,
--       원격 places 테이블에 컬럼이 없어 PGRST204 가 발생함.
--       (hidden 컬럼도 없음 — 앱 Place.hidden ↔ DB is_hidden 매핑 유지)
--
-- Supabase Dashboard → SQL Editor 에서 이 파일을 실행하세요.
-- PostgREST schema cache 는 DDL 후 자동 갱신됩니다.

alter table public.places
  add column if not exists is_hidden boolean not null default false;

comment on column public.places.is_hidden is
  'My Maps/KML soft-hide: true면 TripFlow 목록에서만 숨김';
