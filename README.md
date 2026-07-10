# TripFlow

Next.js 기반 여행 플래너입니다. 인증·여행 상세 데이터는 Supabase에 저장하고, 비로그인 사용자는 LocalStorage를 사용합니다.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

환경 변수는 `.env.local`에 설정합니다. 템플릿은 `.env.example`을 참고하세요.

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 환율 (한국수출입은행 Open API) — 서버 전용
KOREAEXIM_API_KEY=...
```

### 환율 API 키 설정 (한국수출입은행)

1. [한국수출입은행 Open API](https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2&viewtype=C) 또는 [공공데이터포털 — 환율 정보](https://www.data.go.kr/data/3068846/openapi.do)에서 **현재환율(AP01)** 인증키를 발급받습니다.
2. 프로젝트 루트 `.env.local`에 추가합니다 (클라이언트에 노출되지 않도록 `NEXT_PUBLIC_` 접두사 금지).

```bash
KOREAEXIM_API_KEY=발급받은_인증키
```

3. 개발 서버를 재시작합니다 (`npm run dev`).
4. 앱은 `/api/exchange-rate?currency=JPY` Route Handler에서만 수출입은행 API를 호출합니다.
5. 환율 조회가 실패해도 여행 생성·저장은 그대로 진행됩니다. UI에는 「환율을 가져올 수 없습니다.」만 표시됩니다.

참고: 비영업일·영업일 오전 11시 이전에는 당일 데이터가 비어 있을 수 있어, 서버가 최근 영업일 데이터를 자동으로 찾습니다. `JPY(100)` 등 단위 고시는 1단위당 KRW로 나눠 저장합니다. VND·TWD 등 AP01 미제공 통화는 직접 입력으로 안내합니다.

## Supabase Migration

TripFlow는 **Supabase 공식 CLI Migration** 방식을 사용합니다.  
SQL Editor에 SQL을 직접 붙여넣지 말고, `supabase/migrations` 파일로만 스키마를 관리합니다.

### 1. CLI 준비

```bash
npm install
npx supabase --version
```

### 2. 프로젝트 연결 (최초 1회)

```bash
# Supabase 계정 로그인
npm run supabase:login

# 원격 프로젝트 연결 (Dashboard > Project Settings > General 의 Project Ref)
npm run supabase:link -- --project-ref <YOUR_PROJECT_REF>
```

연결이 끝나면 `supabase/.temp` 등에 로컬 링크 정보가 저장됩니다. (gitignore 대상)

### 3. Migration 생성

새 테이블·컬럼·정책은 항상 migration 파일로 만듭니다.

```bash
# 예: notes 관련 변경
npm run supabase:migration:new -- add_notes_index
```

생성된 파일:

```text
supabase/migrations/<timestamp>_add_notes_index.sql
```

이 파일에 SQL만 작성합니다. 앱 코드와 함께 커밋합니다.

현재 적용된 스키마 migration:

| 파일 | 내용 |
|------|------|
| `20260314000001_trips.sql` | trips |
| `20260314000002_places.sql` | places |
| `20260314000003_itineraries.sql` | itineraries |
| `20260314000004_expenses.sql` | expenses |
| `20260314000005_checklists.sql` | checklists |
| `20260314000006_memos.sql` | memos |
| `20260314000007_trip_members.sql` | trip_members (공유 여행 멤버십) |
| `20260314000008_trip_invite.sql` | 이메일 초대 RPC + owner insert policy |
| `20260314000009_detail_rls_members.sql` | places 등 상세 RLS를 trip_members 기준으로 변경 |
| `20260314000010_trip_invites.sql` | trip_invites + 링크 초대 preview/accept RPC |
| `20260314000011_trip_exchange_rate.sql` | trips.currency / exchange_rate / exchange_rate_updated_at |
| `20260314000012_trip_exchange_rate_mode.sql` | exchange_rate_mode / date / unit / provider |

### 4. DB Push (원격 적용)

```bash
# 로컬 migration → 원격 Supabase DB 적용
npm run supabase:db:push
```

적용 상태 확인:

```bash
npm run supabase:migration:list
```

### 5. Rollback

Supabase CLI는 자동 down migration을 제공하지 않습니다. Rollback은 아래 중 하나로 합니다.

#### A. 되돌리는 새 migration 작성 (권장)

잘못 적용한 변경을 **반대 SQL**로 새 migration에 작성한 뒤 push 합니다.

```bash
npm run supabase:migration:new -- rollback_add_notes_index
# 예: drop index / drop policy / alter table ...
npm run supabase:db:push
```

#### B. 로컬 DB 초기화 (로컬 개발만)

로컬 Supabase를 쓰는 경우:

```bash
npm run supabase:db:reset
```

모든 migration을 처음부터 다시 적용합니다. **원격 데이터는 삭제되지 않습니다.**

#### C. migration history 수리

원격에만 기록이 꼬인 경우:

```bash
# 특정 버전을 applied / reverted 로 표시
npm run supabase:migration:repair -- <version> --status applied
# 또는
npm run supabase:migration:repair -- <version> --status reverted
```

`<version>`은 파일명의 타임스탬프입니다. 예: `20260314000001`

### 6. 규칙

- 새 테이블/컬럼/RLS/Index는 **migration 파일로만** 추가한다.
- SQL Editor 수동 실행은 비상시에만 사용하고, 동일 내용을 migration으로도 남긴다.
- `drop table` 같은 파괴적 SQL은 개발용으로만 신중히 사용한다.
- 앱 런타임 동작(Auth, LocalStorage fallback 등)은 migration 방식과 무관하게 유지한다.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase CLI — Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Supabase CLI — db push](https://supabase.com/docs/reference/cli/supabase-db-push)
