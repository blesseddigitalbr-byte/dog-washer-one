alter table public.schedule_simulations
  add column if not exists pet_type text,
  add column if not exists service_mode text,
  add column if not exists grooming_quantity integer not null default 0,
  add column if not exists payment_activation_date date,
  add column if not exists last_included_date date,
  add column if not exists next_renewal_date date,
  add column if not exists standard_weekday integer,
  add column if not exists recurrence_rule_mode text not null default 'standard_weekday',
  add column if not exists reference_date date,
  add column if not exists cycle_start_date date,
  add column if not exists final_service_name text;

alter table public.schedule_simulation_items
  add column if not exists include_grooming boolean not null default false,
  add column if not exists final_service_name text;
