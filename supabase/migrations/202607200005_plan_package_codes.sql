alter table public.packages
  add column if not exists code text,
  add column if not exists audience_code text,
  add column if not exists duration_months integer;

alter table public.packages no force row level security;
alter table public.packages disable row level security;
alter table public.client_packages no force row level security;
alter table public.client_packages disable row level security;
alter table public.packages disable trigger assign_profile_tenant;

update public.packages
set
  audience_code = coalesce(audience_code, case
    when lower(name) like '%raça%espec%' or lower(name) like '%raca%espec%' then 'RAC'
    when lower(name) like '%outras%raça%' or lower(name) like '%outras%raca%' then 'OUT'
    when lower(name) like '%modelo%' then 'MOD'
    else 'GER'
  end),
  duration_months = coalesce(duration_months, case
    when lower(name) like '%trimestral%' then 3
    when lower(name) like '%semestral%' then 6
    when lower(name) like '%anual%' then 12
    when lower(name) like '%mensal%' then 1
    else 1
  end)
where audience_code is null or duration_months is null;

update public.packages
set code = 'PLN-' || audience_code || '-' || case duration_months
  when 1 then 'M1'
  when 3 then 'T3'
  when 6 then 'S6'
  when 12 then 'A12'
  else 'M' || duration_months::text
end
where code is null or code like 'PAC-%' or code like 'PCT-%';

alter table public.packages
  alter column code set not null,
  alter column audience_code set not null,
  alter column duration_months set not null;

alter table public.packages
  add constraint packages_duration_months_positive check (duration_months > 0);

create unique index if not exists packages_organization_code_unique
  on public.packages (organization_id, code);

create table if not exists public.organization_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  counter_key text not null,
  current_value integer not null default 0,
  primary key (organization_id, counter_key)
);

insert into public.organization_counters(organization_id, counter_key, current_value)
select organization_id, 'client_package', count(*)::integer
from public.client_packages
group by organization_id
on conflict (organization_id, counter_key) do update
set current_value = greatest(organization_counters.current_value, excluded.current_value);

create or replace function public.next_client_package_code(p_organization_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_number integer;
begin
  insert into public.organization_counters(organization_id, counter_key, current_value)
  values (p_organization_id, 'client_package', 1)
  on conflict (organization_id, counter_key) do update
  set current_value = organization_counters.current_value + 1
  returning current_value into next_number;
  return 'PAC-' || lpad(next_number::text, 4, '0');
end;
$$;

update public.client_packages
set code = 'PAC-' || lpad(sequence_number::text, 4, '0')
from (
  select id, row_number() over (partition by organization_id order by created_at, id) as sequence_number
  from public.client_packages
) ordered
where public.client_packages.id = ordered.id
  and public.client_packages.code !~ '^PAC-[0-9]+$';

alter table public.packages enable row level security;
alter table public.packages force row level security;
alter table public.client_packages enable row level security;
alter table public.client_packages force row level security;
alter table public.packages enable trigger assign_profile_tenant;
alter table public.organization_counters enable row level security;
alter table public.organization_counters force row level security;
create policy organization_counters_tenant on public.organization_counters for all to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

grant execute on function public.next_client_package_code(uuid) to authenticated;
