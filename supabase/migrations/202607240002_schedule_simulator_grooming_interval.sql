alter table public.schedule_simulations
  add column if not exists grooming_interval_weeks integer not null default 8;
