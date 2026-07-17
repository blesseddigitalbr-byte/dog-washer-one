alter table public.legal_entities
  add column if not exists entity_kind text not null default 'salon'
    check (entity_kind in ('salon', 'school', 'hybrid', 'holding')),
  add column if not exists state_registration text,
  add column if not exists municipal_registration text,
  add column if not exists tax_regime text,
  add column if not exists cnae_codes jsonb not null default '[]'::jsonb,
  add column if not exists nfse_settings jsonb not null default '{}'::jsonb;

alter table public.units
  add column if not exists operation_mode text not null default 'salon'
    check (operation_mode in ('salon', 'school', 'hybrid')),
  add column if not exists ownership_model text not null default 'owned'
    check (ownership_model in ('owned', 'licensed', 'franchised'));

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  acronym text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.organization_brand_agreements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  agreement_type text not null
    check (agreement_type in ('owned', 'license', 'franchise')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended', 'expired', 'terminated')),
  territory text,
  starts_at date,
  ends_at date,
  royalty_percentage numeric(7,4),
  fixed_fee numeric(12,2),
  allowed_modules jsonb not null default '["salon"]'::jsonb,
  contract_storage_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (organization_id, brand_id)
);

create table public.unit_business_areas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  business_area text not null check (business_area in ('salon', 'school')),
  cost_center_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (unit_id, business_area),
  unique (organization_id, cost_center_code)
);

create table public.payment_provider_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid not null references public.legal_entities(id) on delete cascade,
  provider text not null default 'asaas',
  environment text not null default 'sandbox'
    check (environment in ('sandbox', 'production')),
  account_id text,
  wallet_id text,
  secret_reference text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (legal_entity_id, provider, environment)
);

create table public.financial_ledgers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  legal_entity_id uuid not null references public.legal_entities(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  business_area text not null check (business_area in ('salon', 'school')),
  name text not null,
  currency text not null default 'BRL',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (legal_entity_id, unit_id, business_area)
);

create index organization_brand_agreements_org_idx
  on public.organization_brand_agreements (organization_id);
create index unit_business_areas_org_unit_idx
  on public.unit_business_areas (organization_id, unit_id);
create index payment_provider_accounts_entity_idx
  on public.payment_provider_accounts (organization_id, legal_entity_id);
create index financial_ledgers_entity_unit_idx
  on public.financial_ledgers (organization_id, legal_entity_id, unit_id);

alter table public.brands enable row level security;
alter table public.brands force row level security;
create policy authenticated_users_read_brands
  on public.brands for select to authenticated
  using (true);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organization_brand_agreements',
    'unit_business_areas',
    'payment_provider_accounts',
    'financial_ledgers'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated
       using (organization_id = public.current_organization_id())
       with check (organization_id = public.current_organization_id())',
      table_name
    );
  end loop;
end
$$;

insert into public.brands (id, name, acronym, status)
values (
  'd0000000-0000-4000-8000-000000000010',
  'Dog Washer One',
  'DWO',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  acronym = excluded.acronym,
  status = excluded.status;

insert into public.organization_brand_agreements (
  id,
  organization_id,
  brand_id,
  agreement_type,
  status,
  allowed_modules
)
values (
  'd0000000-0000-4000-8000-000000000011',
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000010',
  'owned',
  'active',
  '["salon", "school"]'::jsonb
)
on conflict (id) do nothing;

update public.units
set operation_mode = 'salon',
    ownership_model = 'owned'
where id = 'd0000000-0000-4000-8000-000000000003';

insert into public.unit_business_areas (
  id,
  organization_id,
  unit_id,
  business_area,
  cost_center_code,
  active
)
values (
  'd0000000-0000-4000-8000-000000000012',
  'd0000000-0000-4000-8000-000000000001',
  'd0000000-0000-4000-8000-000000000003',
  'salon',
  'LUX-DOG-SALON',
  true
)
on conflict (id) do nothing;
