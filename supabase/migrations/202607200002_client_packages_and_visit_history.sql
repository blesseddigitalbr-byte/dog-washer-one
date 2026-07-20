create table if not exists public.client_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  client_id uuid not null references public.clientes(id),
  pet_id uuid not null references public.pets(id),
  package_id uuid references public.packages(id) on delete set null,
  code text not null,
  contracted_baths integer not null default 0 check (contracted_baths >= 0),
  contracted_groomings integer not null default 0 check (contracted_groomings >= 0),
  balance_baths integer not null default 0 check (balance_baths >= 0),
  balance_groomings integer not null default 0 check (balance_groomings >= 0),
  price numeric(12,2) not null default 0,
  contract_date date not null default current_date,
  expiry_date date,
  status text not null default 'active' check (status in ('active','inactive','expired','cancelled','consumed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (organization_id, code)
);

alter table public.appointments
  add column if not exists client_package_id uuid references public.client_packages(id) on delete set null;

alter table public.package_sessions
  add column if not exists client_package_id uuid references public.client_packages(id) on delete restrict;
alter table public.package_sessions alter column package_id drop not null;
drop policy if exists tenant_parent_isolation on public.package_sessions;
create policy package_sessions_appointment_tenant on public.package_sessions for all to authenticated
  using (exists (
    select 1 from public.appointments a where a.id = package_sessions.appointment_id
      and a.organization_id = public.current_organization_id() and a.unit_id = public.current_unit_id()
  ))
  with check (exists (
    select 1 from public.appointments a where a.id = package_sessions.appointment_id
      and a.organization_id = public.current_organization_id() and a.unit_id = public.current_unit_id()
  ));

create table if not exists public.visit_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  appointment_id uuid not null unique references public.appointments(id) on delete restrict,
  client_id uuid not null references public.clientes(id),
  pet_id uuid not null references public.pets(id),
  service_id uuid not null references public.services(id),
  professional_id uuid references public.professionals(id) on delete set null,
  client_package_id uuid references public.client_packages(id) on delete set null,
  visited_at timestamptz not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists client_packages_client_pet_idx on public.client_packages(unit_id, client_id, pet_id, status);
create index if not exists visit_history_client_pet_idx on public.visit_history(unit_id, client_id, pet_id, visited_at desc);

alter table public.client_packages enable row level security;
alter table public.client_packages force row level security;
create policy client_packages_tenant on public.client_packages for all to authenticated
  using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id())
  with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id());

alter table public.visit_history enable row level security;
alter table public.visit_history force row level security;
create policy visit_history_tenant on public.visit_history for all to authenticated
  using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id())
  with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id());

create or replace function public.complete_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  apt public.appointments;
  service_name text;
  service_category text;
  session_kind text;
  result public.appointments;
begin
  select * into apt from public.appointments
  where id = p_appointment_id
    and organization_id = public.current_organization_id()
    and unit_id = public.current_unit_id()
  for update;

  if apt.id is null then raise exception 'Agendamento não encontrado'; end if;
  if apt.status = 'completed' then return apt; end if;
  if apt.status <> 'in_progress' then raise exception 'O atendimento precisa estar em andamento'; end if;

  select name, category into service_name, service_category
  from public.services where id = apt.service_id;

  session_kind := case
    when lower(coalesce(service_category, '') || ' ' || coalesce(service_name, '')) like '%tosa%' then 'grooming'
    else 'bath'
  end;

  if apt.client_package_id is not null then
    if session_kind = 'grooming' then
      update public.client_packages set
        balance_groomings = balance_groomings - 1,
        updated_at = now()
      where id = apt.client_package_id and status = 'active' and balance_groomings > 0;
    else
      update public.client_packages set
        balance_baths = balance_baths - 1,
        updated_at = now()
      where id = apt.client_package_id and status = 'active' and balance_baths > 0;
    end if;
    if not found then raise exception 'Pacote sem saldo para este serviço'; end if;

    insert into public.package_sessions(package_id, client_package_id, appointment_id, service_id, session_type)
    select package_id, id, apt.id, apt.service_id, session_kind from public.client_packages where id = apt.client_package_id
    on conflict (appointment_id, service_id) do nothing;

    update public.client_packages set status = 'consumed', updated_at = now()
    where id = apt.client_package_id and balance_baths = 0 and balance_groomings = 0;
  end if;

  update public.appointments set status = 'completed', completed_at = now(), updated_at = now()
  where id = apt.id returning * into result;

  insert into public.visit_history(
    organization_id, unit_id, appointment_id, client_id, pet_id, service_id,
    professional_id, client_package_id, visited_at, notes, created_by
  ) values (
    apt.organization_id, apt.unit_id, apt.id, apt.client_id, apt.pet_id, apt.service_id,
    apt.professional_id, apt.client_package_id, now(), apt.notes, auth.uid()
  ) on conflict (appointment_id) do nothing;

  return result;
end
$$;

grant execute on function public.complete_appointment(uuid) to authenticated;
