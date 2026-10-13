begin;
set local statement_timeout='15s';
do $verify$
declare actor public.profiles; unit uuid; table_name text; denied boolean; fixture uuid:=gen_random_uuid();
begin
 select * into actor from public.profiles where id='668700cd-b04b-4aca-baa6-6509d1fb5790';
 begin
 insert into public.financial_ledgers(id,organization_id,legal_entity_id,unit_id,business_area,name)
 select fixture,actor.organization_id,u.legal_entity_id,actor.unit_id,'salon','QA temporary rollback ledger' from public.units u where u.id=actor.unit_id;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated')::text,true);
 execute 'set local role authenticated';
 if not exists(select 1 from public.financial_ledgers where unit_id=actor.unit_id) then raise exception 'Own ledger unavailable'; end if;
 if exists(select 1 from public.financial_ledgers where unit_id<>actor.unit_id)
 or exists(select 1 from public.payment_provider_accounts a where not exists(select 1 from public.units u where u.id=actor.unit_id and u.legal_entity_id=a.legal_entity_id)) then raise exception 'Other unit financial data exposed'; end if;
 foreach table_name in array array['payment_provider_accounts','financial_ledgers'] loop
 if has_table_privilege('authenticated','public.'||table_name,'INSERT') or has_table_privilege('authenticated','public.'||table_name,'UPDATE') or has_table_privilege('authenticated','public.'||table_name,'DELETE') then raise exception 'Financial write remains'; end if;
 end loop;
 execute 'reset role';
 begin
  -- Simulate staff in the same organization/unit, not an empty foreign tenant.
  update public.profiles set organization_id=actor.organization_id,unit_id=actor.unit_id,role='staff' where id='62b24bca-6a6e-40db-afd4-3448401fe9fd';
  perform set_config('request.jwt.claims','{"sub":"62b24bca-6a6e-40db-afd4-3448401fe9fd","role":"authenticated"}',true);
  execute 'set local role authenticated';
  if exists(select 1 from public.financial_ledgers) or exists(select 1 from public.payment_provider_accounts) then raise exception 'Staff sees financial configuration'; end if;
  raise exception using errcode='PZ002',message='Rollback staff fixture';
 exception when sqlstate 'PZ002' then null;
 end;
 execute 'reset role';
 raise exception using errcode='PZ003',message='Rollback ledger fixture';
 exception when sqlstate 'PZ003' then null;
 end;
 if exists(select 1 from public.financial_ledgers where id=fixture) then raise exception 'Ledger fixture persisted'; end if;
end $verify$;
select 'passed_financial_role_unit_scope' as result;
rollback;
