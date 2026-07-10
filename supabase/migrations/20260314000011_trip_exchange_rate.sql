-- TripFlow J — trips currency + exchange rate

alter table public.trips
  add column if not exists currency text;

alter table public.trips
  add column if not exists exchange_rate numeric;

alter table public.trips
  add column if not exists exchange_rate_updated_at timestamptz;

comment on column public.trips.currency is 'Trip base currency (e.g. JPY, USD, KRW)';
comment on column public.trips.exchange_rate is '1 foreign currency = N KRW';
comment on column public.trips.exchange_rate_updated_at is 'When exchange_rate was last fetched';
