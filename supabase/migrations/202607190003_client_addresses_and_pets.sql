alter table public.clientes
  add column if not exists bairro text;

create table if not exists public.client_addresses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  client_id uuid not null references public.clientes(id) on delete cascade,
  label text not null default 'Principal',
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  uf text,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (client_id, label)
);

create index if not exists client_addresses_org_unit_client_idx
  on public.client_addresses (organization_id, unit_id, client_id);

alter table public.client_addresses enable row level security;
alter table public.client_addresses force row level security;

drop policy if exists client_addresses_tenant_isolation
  on public.client_addresses;
create policy client_addresses_tenant_isolation
  on public.client_addresses for all
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and unit_id = public.current_unit_id()
  )
  with check (
    organization_id = public.current_organization_id()
    and unit_id = public.current_unit_id()
    and exists (
      select 1
      from public.clientes client
      where client.id = client_addresses.client_id
        and client.organization_id = public.current_organization_id()
        and client.unit_id = public.current_unit_id()
    )
  );

insert into public.client_addresses (
  organization_id,
  unit_id,
  client_id,
  cep,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  uf
)
select
  organization_id,
  unit_id,
  id,
  cep,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  uf
from public.clientes
where organization_id is not null
  and unit_id is not null
  and coalesce(cep, logradouro, numero, complemento, bairro, cidade, uf) is not null
on conflict (client_id, label) do nothing;
