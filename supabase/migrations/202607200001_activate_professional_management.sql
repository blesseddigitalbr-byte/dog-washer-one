alter table public.professionals
  add column if not exists role_title text,
  add column if not exists hire_date date,
  add column if not exists commission_percent numeric(5,2) not null default 0,
  add column if not exists notes text;

create index if not exists professionals_active_unit_idx
  on public.professionals (unit_id, is_active, name);
