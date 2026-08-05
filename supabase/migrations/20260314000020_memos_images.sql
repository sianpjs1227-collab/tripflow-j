-- TripFlow J — memos.images (일반 메모 다중 사진)
-- list 항목의 checked/imageUrl 은 기존 items jsonb 안에 저장 (스키마 변경 불필요)
--
-- Supabase Dashboard → SQL Editor 에서 실행하세요.

alter table public.memos
  add column if not exists images jsonb;

comment on column public.memos.images is
  '일반 메모(text) 첨부 사진 data URL 배열. list 메모는 null. 레거시 행은 null';

-- list 항목 주석 갱신 (checked 필드 포함)
comment on column public.memos.items is
  'list 메모 항목 [{id,name,memo?,imageUrl?,checked?}]. text 메모는 null';
