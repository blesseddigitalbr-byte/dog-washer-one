create table if not exists public.schedule_simulations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  client_id uuid not null references public.clientes(id),
  pet_id uuid not null references public.pets(id),
  client_package_id uuid references public.client_packages(id) on delete set null,
  service_id uuid not null references public.services(id),
  professional_id uuid not null references public.professionals(id),
  frequency text not null check (frequency in ('weekly','biweekly','every_21_days','monthly','once')),
  start_date date not null,
  end_date date,
  default_time time not null,
  quantity integer not null check (quantity between 1 and 60),
  status text not null default 'draft' check (status in ('draft','confirmed','cancelled')),
  notes text,
  message_text text,
  created_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.schedule_simulation_items (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.schedule_simulations(id) on delete cascade,
  scheduled_at timestamptz not null,
  client_package_id uuid references public.client_packages(id) on delete set null,
  status text not null default 'valid' check (status in ('valid','warning','conflict','ignored','created')),
  alerts jsonb not null default '[]'::jsonb,
  appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (simulation_id, scheduled_at)
);

create table if not exists public.communication_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  client_id uuid not null references public.clientes(id),
  pet_id uuid references public.pets(id) on delete set null,
  client_package_id uuid references public.client_packages(id) on delete set null,
  simulation_id uuid references public.schedule_simulations(id) on delete set null,
  channel text not null default 'whatsapp',
  content text not null,
  status text not null default 'generated' check (status in ('generated','sent','error','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists schedule_simulations_unit_created_idx on public.schedule_simulations(unit_id, created_at desc);
create index if not exists simulation_items_simulation_date_idx on public.schedule_simulation_items(simulation_id, scheduled_at);
create index if not exists communication_history_client_idx on public.communication_history(unit_id, client_id, created_at desc);

alter table public.schedule_simulations enable row level security;
alter table public.schedule_simulations force row level security;
alter table public.schedule_simulation_items enable row level security;
alter table public.schedule_simulation_items force row level security;
alter table public.communication_history enable row level security;
alter table public.communication_history force row level security;

create policy schedule_simulations_tenant on public.schedule_simulations for all to authenticated
  using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id())
  with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id());

create policy schedule_simulation_items_parent on public.schedule_simulation_items for all to authenticated
  using (exists (
    select 1 from public.schedule_simulations simulation
    where simulation.id = schedule_simulation_items.simulation_id
      and simulation.organization_id = public.current_organization_id()
      and simulation.unit_id = public.current_unit_id()
  ))
  with check (exists (
    select 1 from public.schedule_simulations simulation
    where simulation.id = schedule_simulation_items.simulation_id
      and simulation.organization_id = public.current_organization_id()
      and simulation.unit_id = public.current_unit_id()
  ));

create policy communication_history_tenant on public.communication_history for all to authenticated
  using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id())
  with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id());
