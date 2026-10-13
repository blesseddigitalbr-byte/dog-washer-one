-- Authorized QA organization only. No auth accounts, provider calls or real data.
-- Persists fixture only if cross-organization assertions pass.
begin;
set local statement_timeout='15s';
do $qa$
declare
  actor public.profiles;
  org uuid:=gen_random_uuid(); entity uuid:=gen_random_uuid(); unit uuid:=gen_random_uuid();
  account uuid:=gen_random_uuid(); ledger uuid:=gen_random_uuid();
  rejected boolean;
begin
  if exists(select 1 from public.organizations where name='DWO QA — Isolamento SaaS') then
    raise exception 'QA organization already exists; inspect instead of duplicating'; end if;
  select * into actor from public.profiles where active and role in ('owner','admin')
    and organization_id is not null and unit_id is not null order by id limit 1;
  if actor.id is null then raise exception 'Authorized context unavailable'; end if;
  insert into public.organizations(id,name,description,settings)
    values(org,'DWO QA — Isolamento SaaS','Fictitious organization. No real customers or transactions.',
      '{"qa_fixture":true,"outbound_disabled":true}'::jsonb);
  insert into public.legal_entities(id,organization_id,company_name,trading_name,entity_kind)
    values(entity,org,'DWO QA fictitious company','DWO QA','salon');
  insert into public.units(id,organization_id,legal_entity_id,name,code,unit_type,operation_mode)
    values(unit,org,entity,'DWO QA fictitious salon','DWO-QA-ISOLATION','salon','salon');
  insert into public.payment_provider_accounts(id,organization_id,legal_entity_id,environment,secret_reference,status)
    values(account,org,entity,'sandbox','QA_DISABLED_NO_CREDENTIAL','pending');
  insert into public.financial_ledgers(id,organization_id,legal_entity_id,unit_id,business_area,name)
    values(ledger,org,entity,unit,'salon','DWO QA fictitious ledger');
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  if public.current_organization_id() is distinct from actor.organization_id then
    raise exception 'Authentication context invalid'; end if;
  if exists(select 1 from public.units where id=unit)
    or exists(select 1 from public.legal_entities where id=entity)
    or exists(select 1 from public.payment_provider_accounts where id=account)
    or exists(select 1 from public.financial_ledgers where id=ledger) then
    raise exception 'Cross-organization read exposed QA data'; end if;
  update public.legal_entities set trading_name='Unauthorized modification' where id=entity;
  if found then raise exception 'Cross-organization update succeeded'; end if;
  rejected:=false;
  begin
    insert into public.legal_entities(organization_id,company_name)
      values(org,'QA unauthorized company');
  exception when insufficient_privilege then rejected:=true;
  end;
  if not rejected then raise exception 'Cross-organization insert succeeded'; end if;
  execute 'reset role';
end $qa$;
select jsonb_build_object('fixture_created',true,'cross_org_read','denied',
  'cross_org_update','denied','cross_org_insert','denied','provider_status','pending',
  'second_user_test','pending') as result;
commit;
