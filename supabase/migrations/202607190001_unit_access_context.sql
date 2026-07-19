create table if not exists public.user_unit_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  access_role text not null default 'staff'
    check (access_role in ('owner', 'admin', 'manager', 'staff', 'student')),
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (user_id, unit_id)
);

create index if not exists user_unit_access_user_idx
  on public.user_unit_access (user_id, active);
create index if not exists user_unit_access_org_unit_idx
  on public.user_unit_access (organization_id, unit_id);

insert into public.user_unit_access (
  user_id,
  organization_id,
  unit_id,
  access_role,
  is_default,
  active
)
select
  id,
  organization_id,
  unit_id,
  role,
  true,
  true
from public.profiles
where organization_id is not null
  and unit_id is not null
on conflict (user_id, unit_id) do update set
  organization_id = excluded.organization_id,
  access_role = excluded.access_role,
  active = true;

alter table public.user_unit_access enable row level security;
alter table public.user_unit_access force row level security;

drop policy if exists users_read_own_unit_access on public.user_unit_access;
create policy users_read_own_unit_access
  on public.user_unit_access for select
  to authenticated
  using (
    user_id = auth.uid()
    and organization_id = public.current_organization_id()
  );

create or replace function public.switch_active_unit(target_unit_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_org_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select organization_id
    into current_org_id
  from public.profiles
  where id = current_user_id
    and active = true;

  if current_org_id is null then
    raise exception 'User has no active organization';
  end if;

  if not exists (
    select 1
    from public.user_unit_access access
    join public.units unit on unit.id = access.unit_id
    where access.user_id = current_user_id
      and access.organization_id = current_org_id
      and access.unit_id = target_unit_id
      and access.active = true
      and unit.organization_id = current_org_id
      and unit.is_active = true
  ) then
    raise exception 'Unit access denied';
  end if;

  update public.profiles
  set unit_id = target_unit_id,
      updated_at = now()
  where id = current_user_id;

  return target_unit_id;
end;
$$;

revoke all on function public.switch_active_unit(uuid) from public;
grant execute on function public.switch_active_unit(uuid) to authenticated;
