alter table public.pets
  add column if not exists photo_storage_key text;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and active = true
$$;

revoke all on function public.current_profile_role() from public;
grant execute on function public.current_profile_role() to authenticated;

alter table public.legal_entities enable row level security;
alter table public.legal_entities force row level security;

drop policy if exists organization_legal_entities_read on public.legal_entities;
create policy organization_legal_entities_read
  on public.legal_entities for select
  to authenticated
  using (organization_id = public.current_organization_id());

drop policy if exists organization_legal_entities_manage on public.legal_entities;
create policy organization_legal_entities_manage
  on public.legal_entities for all
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  );

drop policy if exists organization_units_manage on public.units;
create policy organization_units_manage
  on public.units for all
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  );

drop policy if exists organization_unit_access_manage on public.user_unit_access;
create policy organization_unit_access_manage
  on public.user_unit_access for all
  to authenticated
  using (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  )
  with check (
    organization_id = public.current_organization_id()
    and public.current_profile_role() in ('owner', 'admin')
  );
