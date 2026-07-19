alter table public.appointments
  add column if not exists end_time text,
  add column if not exists total_price numeric(12,2) not null default 0,
  add column if not exists recurrence_rule text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists appointments_unit_professional_date_idx
  on public.appointments (unit_id, professional_id, appointment_date);

create table if not exists public.appointment_services (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  unit_price numeric(12,2) not null default 0,
  duration_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  unique (appointment_id, service_id)
);

alter table public.appointment_services enable row level security;
alter table public.appointment_services force row level security;

drop policy if exists appointment_services_parent_isolation
  on public.appointment_services;
create policy appointment_services_parent_isolation
  on public.appointment_services for all
  to authenticated
  using (
    exists (
      select 1
      from public.appointments appointment
      where appointment.id = appointment_services.appointment_id
        and appointment.organization_id = public.current_organization_id()
        and appointment.unit_id = public.current_unit_id()
    )
  )
  with check (
    exists (
      select 1
      from public.appointments appointment
      where appointment.id = appointment_services.appointment_id
        and appointment.organization_id = public.current_organization_id()
        and appointment.unit_id = public.current_unit_id()
    )
  );

create or replace function public.record_appointment_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.appointment_status_history (
      appointment_id,
      status,
      changed_by,
      reason
    )
    values (
      new.id,
      new.status,
      auth.uid(),
      case
        when new.status in ('cancelled', 'no_show')
          then new.cancellation_reason
        else null
      end
    );
  end if;
  return new;
end;
$$;

drop trigger if exists record_appointment_status on public.appointments;
create trigger record_appointment_status
  after insert or update of status on public.appointments
  for each row execute function public.record_appointment_status();
