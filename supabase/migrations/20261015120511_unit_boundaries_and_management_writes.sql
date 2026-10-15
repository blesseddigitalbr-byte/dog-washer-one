-- No data backfill. Restrictive guards supplement every existing permissive policy.
do $$
declare t text; op text;
begin
  foreach t in array array['clientes','clients','pets','services','professionals','appointments','students','packages','client_packages'] loop
    if to_regclass(format('public.%I',t)) is null then continue; end if;
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy unit_boundary_guard on public.%I as restrictive for all to authenticated using (
      organization_id = (select public.current_organization_id())
      and unit_id = (select public.current_unit_id())
      and exists(select 1 from public.user_unit_access ua where ua.user_id=(select auth.uid()) and ua.organization_id=%I.organization_id and ua.unit_id=%I.unit_id and ua.active)
    ) with check (
      organization_id = (select public.current_organization_id())
      and unit_id = (select public.current_unit_id())
      and exists(select 1 from public.user_unit_access ua where ua.user_id=(select auth.uid()) and ua.organization_id=%I.organization_id and ua.unit_id=%I.unit_id and ua.active)
    )',t,t,t,t,t);
  end loop;
  foreach t in array array['packages','services','professionals','client_packages'] loop
    foreach op in array array['insert','update','delete'] loop
      execute format('create policy management_%s_guard on public.%I as restrictive for %s to authenticated %s',
        op,t,op,
        case when op='insert' then 'with check ((select public.current_profile_role()) in (''owner'',''admin'',''manager''))'
             when op='update' then 'using ((select public.current_profile_role()) in (''owner'',''admin'',''manager'')) with check ((select public.current_profile_role()) in (''owner'',''admin'',''manager''))'
             else 'using ((select public.current_profile_role()) in (''owner'',''admin'',''manager''))' end);
    end loop;
  end loop;
end $$;

-- A foreign key proves existence, not tenant ownership. Check links without bypassing RLS.
create or replace function private.guard_operational_unit_link()
returns trigger language plpgsql security invoker set search_path='' as $$
declare parent_id uuid; valid boolean;
begin
  parent_id := (to_jsonb(new)->>tg_argv[1])::uuid;
  if parent_id is null then return new; end if;
  execute format('select exists(select 1 from public.%I where id=$1 and organization_id=$2 and unit_id=$3)',tg_argv[0])
    into valid using parent_id,new.organization_id,new.unit_id;
  if not valid then raise exception 'Related record not available in this unit' using errcode='42501'; end if;
  return new;
end $$;
revoke all on function private.guard_operational_unit_link() from public,anon,authenticated;
do $$
declare r record;
begin
  for r in select * from (values
    ('pets','clientes','client_id'),
    ('appointments','clientes','client_id'),('appointments','pets','pet_id'),
    ('appointments','services','service_id'),('appointments','professionals','professional_id'),
    ('appointments','students','student_id'),('appointments','client_packages','client_package_id'),
    ('client_packages','clientes','client_id'),('client_packages','pets','pet_id'),('client_packages','packages','package_id')
  ) links(child,parent,fk) loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function private.guard_operational_unit_link(%L,%L)',
      'zz_unit_link_'||r.fk,r.child,r.parent,r.fk);
  end loop;
end $$;

-- Payments/events have no unit column: require a local billing binding AND the correct account/legal entity.
create policy payment_unit_account_guard on public.asaas_payments as restrictive for select to authenticated using (
  organization_id=(select public.current_organization_id())
  and (select public.current_profile_role()) in ('owner','admin','manager')
  and exists(select 1 from public.payment_provider_accounts a
    join public.units u on u.legal_entity_id=a.legal_entity_id and u.organization_id=a.organization_id
    join public.user_unit_access ua on ua.unit_id=u.id and ua.organization_id=u.organization_id and ua.user_id=(select auth.uid()) and ua.active
    where a.id=asaas_payments.account_id and a.organization_id=asaas_payments.organization_id and u.id=(select public.current_unit_id()))
  and exists(select 1 from public.billing_drafts b where b.organization_id=asaas_payments.organization_id
    and b.unit_id=(select public.current_unit_id()) and b.account_id=asaas_payments.account_id and b.provider_payment_id=asaas_payments.external_id)
);
create policy event_unit_account_guard on public.asaas_webhook_events as restrictive for select to authenticated using (
  organization_id=(select public.current_organization_id())
  and (select public.current_profile_role()) in ('owner','admin','manager')
  and exists(select 1 from public.payment_provider_accounts a
    join public.units u on u.legal_entity_id=a.legal_entity_id and u.organization_id=a.organization_id
    join public.user_unit_access ua on ua.unit_id=u.id and ua.organization_id=u.organization_id and ua.user_id=(select auth.uid()) and ua.active
    where a.id=asaas_webhook_events.account_id and a.organization_id=asaas_webhook_events.organization_id and u.id=(select public.current_unit_id()))
  and exists(select 1 from public.billing_drafts b where b.organization_id=asaas_webhook_events.organization_id
    and b.unit_id=(select public.current_unit_id()) and b.account_id=asaas_webhook_events.account_id and b.provider_payment_id=asaas_webhook_events.payment_id)
);
