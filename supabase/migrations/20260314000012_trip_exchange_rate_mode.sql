-- TripFlow J — exchange rate mode / date / unit / provider

alter table public.trips
  add column if not exists exchange_rate_mode text;

alter table public.trips
  add column if not exists exchange_rate_date date;

alter table public.trips
  add column if not exists exchange_rate_unit numeric;

alter table public.trips
  add column if not exists exchange_rate_provider text;

comment on column public.trips.exchange_rate_mode is 'startDate | current | manual';
comment on column public.trips.exchange_rate_date is 'FX reference date (YYYY-MM-DD)';
comment on column public.trips.exchange_rate_unit is 'Display unit (1 or 100)';
comment on column public.trips.exchange_rate_provider is 'koreaexim | manual';
