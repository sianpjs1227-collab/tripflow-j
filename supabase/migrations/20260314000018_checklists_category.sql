-- TripFlow J — checklists.category
-- 앱 ChecklistItem.category(예약/여행 준비/짐/기타)를 저장한다.
-- null 이면 UI에서 "직접 추가" 그룹으로 표시한다.

alter table public.checklists
  add column if not exists category text;

comment on column public.checklists.category is
  'Checklist group label (예약/여행 준비/짐/기타). null = 직접 추가';

-- 기존 기본 항목(title 일치)은 category 백필
update public.checklists
set category = case title
  when '항공권 예약' then '예약'
  when '숙소 예약' then '예약'
  when '식당 예약' then '예약'
  when '액티비티 예약' then '예약'
  when '여권 확인' then '여행 준비'
  when 'eSIM 구매' then '여행 준비'
  when '여행자 보험' then '여행 준비'
  when '환전' then '여행 준비'
  when '충전기' then '짐'
  when '보조배터리' then '짐'
  when '상비약' then '짐'
  when '세면도구' then '짐'
  when '체크인 완료' then '기타'
  when '공항 이동수단 확인' then '기타'
  when '신용카드 확인' then '기타'
  else category
end
where category is null;
