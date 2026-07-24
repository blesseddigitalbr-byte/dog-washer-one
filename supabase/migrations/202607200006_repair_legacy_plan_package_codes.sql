-- Repara registros legados que possam ter sido criados antes da separação PLN/PAC.
alter table public.packages no force row level security;
alter table public.packages disable row level security;
alter table public.client_packages no force row level security;
alter table public.client_packages disable row level security;
alter table public.packages disable trigger assign_profile_tenant;

update public.packages
set code = 'PLN-' || coalesce(nullif(audience_code, ''), 'GER') || '-' ||
  case duration_months
    when 1 then 'M1'
    when 3 then 'T3'
    when 6 then 'S6'
    when 12 then 'A12'
    else 'M' || greatest(coalesce(duration_months, 1), 1)::text
  end
where code is null or code !~ '^PLN-[A-Z0-9]{2,8}-(M1|T3|S6|A12|M[0-9]+)$';

with current_max as (
  select organization_id,
         coalesce(max((regexp_match(code, '^PAC-([0-9]+)$'))[1]::integer), 0) as maximum
  from public.client_packages
  group by organization_id
),
legacy as (
  select cp.id, cp.organization_id,
         row_number() over (partition by cp.organization_id order by cp.created_at, cp.id) as sequence,
         coalesce(cm.maximum, 0) as current_maximum
  from public.client_packages cp
  left join current_max cm on cm.organization_id = cp.organization_id
  where cp.code is null or cp.code !~ '^PAC-[0-9]+$'
)
update public.client_packages cp
set code = 'PAC-' || lpad((legacy.current_maximum + legacy.sequence)::text, 4, '0')
from legacy
where cp.id = legacy.id;

insert into public.organization_counters(organization_id, counter_key, current_value)
select organization_id, 'client_package',
       coalesce(max((regexp_match(code, '^PAC-([0-9]+)$'))[1]::integer), 0)
from public.client_packages
where code ~ '^PAC-[0-9]+$'
group by organization_id
on conflict (organization_id, counter_key)
do update set current_value = greatest(public.organization_counters.current_value, excluded.current_value);

alter table public.packages enable trigger assign_profile_tenant;
alter table public.packages enable row level security;
alter table public.packages force row level security;
alter table public.client_packages enable row level security;
alter table public.client_packages force row level security;
