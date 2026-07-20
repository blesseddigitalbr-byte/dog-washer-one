alter table public.appointments
  add column if not exists appointment_type text not null default 'standalone'
    check (appointment_type in ('package','standalone'));

alter table public.schedule_simulations
  add column if not exists appointment_type text not null default 'standalone'
    check (appointment_type in ('package','standalone'));
