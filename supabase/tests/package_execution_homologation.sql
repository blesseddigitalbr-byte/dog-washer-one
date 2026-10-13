-- Run inside the migration transaction before COMMIT. Fixtures roll back.
do $test$
<<qa>>
declare
  actor public.profiles;
  client_id uuid:=gen_random_uuid(); pet_id uuid:=gen_random_uuid();
  professional_id uuid:=gen_random_uuid(); service_id uuid:=gen_random_uuid();
  old_package uuid:=gen_random_uuid(); next_package uuid:=gen_random_uuid();
  bath_visit uuid:=gen_random_uuid(); combo_visit uuid:=gen_random_uuid();
  failed_visit uuid:=gen_random_uuid(); rejected boolean;
begin
  select * into actor from public.profiles where active and role in ('owner','admin','manager')
    and organization_id is not null and unit_id is not null order by id limit 1;
  if actor.id is null then raise exception 'No authorized fixture context'; end if;
  if has_function_privilege('anon','public.complete_appointment(uuid)','EXECUTE') then
    raise exception 'Anonymous completion permitted'; end if;
  begin
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    insert into public.clientes(id,organization_id,unit_id,id_cliente,nome)
      values(client_id,actor.organization_id,actor.unit_id,'QA-'||client_id,'DWO package rollback test');
    insert into public.pets(id,organization_id,unit_id,client_id,id_pet,name)
      values(pet_id,actor.organization_id,actor.unit_id,client_id,'QA-'||pet_id,'DWO package rollback pet');
    insert into public.professionals(id,organization_id,unit_id,name)
      values(professional_id,actor.organization_id,actor.unit_id,'DWO package rollback professional');
    insert into public.services(id,organization_id,unit_id,name,duration_minutes,price)
      values(service_id,actor.organization_id,actor.unit_id,'Banho com tosa higiênica QA',60,100);
    insert into public.client_packages(id,organization_id,unit_id,client_id,pet_id,code,
      contracted_baths,contracted_groomings,balance_baths,balance_groomings,contract_date,expiry_date,status)
      values(old_package,actor.organization_id,actor.unit_id,client_id,pet_id,'QA-'||old_package,
        1,0,0,0,current_date-30,current_date-1,'consumed'),
      (next_package,actor.organization_id,actor.unit_id,client_id,pet_id,'QA-'||next_package,
        2,1,2,1,current_date-1,current_date+30,'active');
    insert into public.appointments(id,organization_id,unit_id,client_id,pet_id,service_id,
      professional_id,appointment_date,duration_minutes,status,client_package_id,include_grooming)
      values(bath_visit,actor.organization_id,actor.unit_id,client_id,pet_id,service_id,professional_id,
        now()-interval '6 hours',60,'in_progress',old_package,false),
      (combo_visit,actor.organization_id,actor.unit_id,client_id,pet_id,service_id,professional_id,
        now()-interval '4 hours',60,'in_progress',next_package,true),
      (failed_visit,actor.organization_id,actor.unit_id,client_id,pet_id,service_id,professional_id,
        now()-interval '2 hours',60,'in_progress',next_package,false);
    -- A different existing tenant must not complete even a known appointment ID.
    perform set_config('request.jwt.claims',jsonb_build_object('sub','62b24bca-6a6e-40db-afd4-3448401fe9fd','role','authenticated')::text,true);
    if public.current_organization_id()=actor.organization_id then raise exception 'Cross-tenant fixture requires a different actor'; end if;
    rejected:=false;
    begin perform public.complete_appointment(bath_visit);
    exception when others then
      if sqlerrm<>'Agendamento não encontrado' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Cross-tenant completion permitted'; end if;
    rejected:=false;
    begin perform public.reverse_appointment_execution(bath_visit,'QA forbidden staff reversal');
    exception when others then
      if sqlerrm<>'Reversão restrita à gestão' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Staff reversal permitted'; end if;
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated')::text,true);
    if not exists(select 1 from public.client_packages where id=next_package and balance_baths=2 and balance_groomings=1) then raise exception 'Rejected call altered balance'; end if;
    perform public.complete_appointment(bath_visit);
    if not exists(select 1 from public.client_packages where id=next_package and balance_baths=1 and balance_groomings=1) then
      raise exception 'Hygienic trim incorrectly consumed grooming or renewal failed'; end if;
    if not exists(select 1 from public.appointment_package_allocations where appointment_id=bath_visit
      and requested_package_id=old_package and consumed_package_id=next_package) then
      raise exception 'Renewal provenance missing'; end if;
    perform public.complete_appointment(bath_visit);
    if (select count(*) from public.package_sessions where appointment_id=bath_visit)<>1 then
      raise exception 'Duplicate consumption'; end if;
    perform public.complete_appointment(combo_visit);
    if not exists(select 1 from public.client_packages where id=next_package and balance_baths=0 and balance_groomings=0 and status='consumed') then
      raise exception 'Combo did not consume bath and grooming'; end if;
    rejected:=false;
    begin perform public.complete_appointment(failed_visit);
    exception when others then
      if sqlerrm not like '%Nenhum pacote válido%' then raise; end if; rejected:=true;
    end;
    if not rejected or exists(select 1 from public.visit_history where appointment_id=failed_visit) then
      raise exception 'Insufficient balance accepted or partial history persisted'; end if;
    perform public.reverse_appointment_execution(combo_visit,'QA incorrect completion');
    perform public.reverse_appointment_execution(combo_visit,'QA repeated reversal');
    if not exists(select 1 from public.client_packages where id=next_package and balance_baths=1 and balance_groomings=1 and status='active') then
      raise exception 'Reversal did not restore exactly one bath and grooming'; end if;
    rejected:=false;
    begin perform public.complete_appointment(combo_visit);
    exception when others then
      if sqlerrm not like '%Baixa revertida%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Reversed visit completed again'; end if;
    rejected:=false;
    begin update public.appointments set include_grooming=true where id=bath_visit;
    exception when others then
      if sqlerrm not like '%não pode ser alterado%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Completed grooming choice editable'; end if;
    perform set_config('request.jwt.claims','{}',true);
    rejected:=false;
    begin perform public.complete_appointment(failed_visit);
    exception when others then
      if sqlerrm not like '%equipe autorizada%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Missing identity permitted'; end if;
    raise exception using errcode='PZ001',message='Rollback fixtures';
  exception when sqlstate 'PZ001' then null;
  end;
  if exists(select 1 from public.clientes where id=qa.client_id) then raise exception 'Fixture cleanup failed'; end if;
end $test$;
