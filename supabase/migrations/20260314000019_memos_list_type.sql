-- TripFlow J — memos list type
-- 코드가 insert/update 하는 컬럼: type, items
-- 기존 일반 메모: type='text' (default), items=null
--
-- Supabase Dashboard → SQL Editor 에서 이 파일 전체를 실행하세요.
-- PostgREST schema cache 는 DDL 후 자동 갱신됩니다.

alter table public.memos
  add column if not exists type text not null default 'text';

alter table public.memos
  add column if not exists items jsonb;

comment on column public.memos.type is
  'text = 일반 메모, list = 리스트 메모';

comment on column public.memos.items is
  'list 메모 항목 배열 [{id,name,memo?,imageUrl?}]. text 메모는 null';

-- 레거시 행 → 일반 메모로 보장
update public.memos
set type = 'text'
where type is null or type = '';

-- type 값 제한 (이미 있으면 있으면 시 무시)
do $$
begin
  alter table public.memos
    add constraint memos_type_check
    check (type in ('text', 'list'));
exception
  when duplicate_object then null;
end $$;
