-- Adds tenant ownership to the operational tables used by the current API.
-- Existing records intentionally remain without a tenant until the controlled
-- spreadsheet import/backfill assigns them to the correct organization.

alter table if exists public.clientes
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.clients
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.pets
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.services
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.professionals
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.appointments
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.students
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

alter table if exists public.packages
  add column if not exists organization_id uuid references public.organizations(id),
  add column if not exists unit_id uuid references public.units(id);

create index if not exists clientes_organization_unit_idx
  on public.clientes (organization_id, unit_id);
create index if not exists pets_organization_unit_idx
  on public.pets (organization_id, unit_id);
create index if not exists services_organization_unit_idx
  on public.services (organization_id, unit_id);
create index if not exists professionals_organization_unit_idx
  on public.professionals (organization_id, unit_id);
create index if not exists appointments_organization_unit_idx
  on public.appointments (organization_id, unit_id);
create index if not exists students_organization_unit_idx
  on public.students (organization_id, unit_id);
create index if not exists packages_organization_unit_idx
  on public.packages (organization_id, unit_id);

create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id
  from public.profiles
  where id = auth.uid() and active = true
$$;

create or replace function public.current_unit_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select unit_id
  from public.profiles
  where id = auth.uid() and active = true
$$;

create or replace function public.assign_profile_tenant()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  profile_organization uuid := public.current_organization_id();
  profile_unit uuid := public.current_unit_id();
begin
  if profile_organization is null then
    raise exception 'User has no active organization';
  end if;

  if new.organization_id is not null
     and new.organization_id <> profile_organization then
    raise exception 'Cross-organization write denied';
  end if;
  new.organization_id := profile_organization;

  if profile_unit is not null then
    if new.unit_id is not null and new.unit_id <> profile_unit then
      raise exception 'Cross-unit write denied';
    end if;
    new.unit_id := profile_unit;
  end if;

  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clientes',
    'clients',
    'pets',
    'services',
    'professionals',
    'appointments',
    'students',
    'packages'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('alter table public.%I force row level security', table_name);
      execute format('drop policy if exists tenant_isolation on public.%I', table_name);
      execute format(
        'create policy tenant_isolation on public.%I for all to authenticated
         using (organization_id = public.current_organization_id())
         with check (organization_id = public.current_organization_id())',
        table_name
      );
      execute format(
        'drop trigger if exists assign_profile_tenant on public.%I',
        table_name
      );
      execute format(
        'create trigger assign_profile_tenant
         before insert or update on public.%I
         for each row execute function public.assign_profile_tenant()',
        table_name
      );
    end if;
  end loop;
end
$$;

-- Child tables inherit their tenant boundary from the owning parent record.
do $$
declare
  item record;
begin
  for item in
    select *
    from (values
      ('galeria_pets', 'pets', 'pet_id'),
      ('appointment_pets', 'appointments', 'appointment_id'),
      ('appointment_students', 'appointments', 'appointment_id'),
      ('appointmentStudents', 'appointments', 'appointment_id'),
      ('appointment_status_history', 'appointments', 'appointment_id'),
      ('package_sessions', 'packages', 'package_id')
    ) as mappings(child_table, parent_table, foreign_key)
  loop
    if to_regclass(format('public.%I', item.child_table)) is not null then
      execute format(
        'alter table public.%I enable row level security',
        item.child_table
      );
      execute format(
        'alter table public.%I force row level security',
        item.child_table
      );
      execute format(
        'drop policy if exists tenant_parent_isolation on public.%I',
        item.child_table
      );
      execute format(
        'create policy tenant_parent_isolation on public.%I for all to authenticated
         using (
           exists (
             select 1 from public.%I parent
             where parent.id = %I.%I
               and parent.organization_id = public.current_organization_id()
           )
         )
         with check (
           exists (
             select 1 from public.%I parent
             where parent.id = %I.%I
               and parent.organization_id = public.current_organization_id()
           )
         )',
        item.child_table,
        item.parent_table,
        item.child_table,
        item.foreign_key,
        item.parent_table,
        item.child_table,
        item.foreign_key
      );
    end if;
  end loop;
end
$$;

alter table if exists public.organizations enable row level security;
alter table if exists public.organizations force row level security;
drop policy if exists organization_members_read on public.organizations;
create policy organization_members_read
  on public.organizations for select to authenticated
  using (id = public.current_organization_id());

alter table if exists public.units enable row level security;
alter table if exists public.units force row level security;
drop policy if exists organization_units_read on public.units;
create policy organization_units_read
  on public.units for select to authenticated
  using (organization_id = public.current_organization_id());
