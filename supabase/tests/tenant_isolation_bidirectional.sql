-- Existing authorized identities only. No credentials, Auth writes or external calls.
begin;
set local statement_timeout='15s';
do $test$
declare
  actor uuid; expected_org uuid; forbidden_unit uuid;
  table_name text; exposed bigint; affected bigint; denied boolean;
begin
  foreach actor in array array['62b24bca-6a6e-40db-afd4-3448401fe9fd'::uuid,'668700cd-b04b-4aca-baa6-6509d1fb5790'::uuid] loop
    select organization_id into expected_org from public.profiles where id=actor and active;
    if expected_org is null then raise exception 'Missing active test identity'; end if;
    select id into forbidden_unit from public.units where organization_id<>expected_org and is_active limit 1;
    if forbidden_unit is null then raise exception 'Missing cross-tenant target'; end if;
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if public.current_organization_id() is distinct from expected_org then raise exception 'Invalid identity context'; end if;
    if not exists(select 1 from public.clientes where organization_id=expected_org) then raise exception 'Own clients invisible: invalid positive control'; end if;
    foreach table_name in array array['clientes','pets','units','legal_entities','payment_provider_accounts','financial_ledgers','user_unit_access','profiles','appointments','packages','client_packages','services','professionals','schedule_simulations','billing_drafts','asaas_payments','external_invoices','invoice_drafts','visit_history'] loop
      begin
        execute format('select count(*) from public.%I where organization_id<>$1',table_name) into exposed using expected_org;
        if exposed<>0 then raise exception 'Cross-tenant exposure in %',table_name; end if;
      exception when insufficient_privilege then null; -- denied table access is also safe
      end;
    end loop;
    update public.clientes set organization_id=organization_id where organization_id<>expected_org;
    get diagnostics affected=row_count;
    if affected<>0 then raise exception 'Cross-tenant update permitted'; end if;
    denied:=false;
    begin
      perform public.switch_active_unit(forbidden_unit);
    exception when others then
      if sqlerrm='Unit access denied' then denied:=true; else raise; end if;
    end;
    if not denied then raise exception 'Cross-tenant unit switch permitted'; end if;
    if public.current_organization_id() is distinct from expected_org then raise exception 'Context changed after denied switch'; end if;
    execute 'reset role';
  end loop;
end $test$;
select jsonb_build_object('directions_tested',2,'tables_per_direction',19,'own_client_control','passed','cross_tenant_reads','denied','cross_tenant_client_updates','denied','cross_tenant_unit_switch','denied','persisted_changes',false) as result;
rollback;
