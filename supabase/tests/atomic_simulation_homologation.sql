-- Execute after the migration definitions, BEFORE their COMMIT.
-- All fixture writes are rolled back in a subtransaction. Any unexpected failure
-- propagates and aborts installation. No provider or external network calls.
do $test$
<<qa>>
declare
  actor public.profiles;
  client_id uuid:=gen_random_uuid(); pet_id uuid:=gen_random_uuid();
  professional_id uuid:=gen_random_uuid(); service_id uuid:=gen_random_uuid();
  package_id uuid:=gen_random_uuid(); sim_id uuid:=gen_random_uuid();
  failure_sim uuid:=gen_random_uuid(); other_sim uuid:=gen_random_uuid();
  extra_sim uuid:=gen_random_uuid();
  start_at timestamptz:=((current_date+7)::text || ' 10:00:00 America/Sao_Paulo')::timestamptz;
  result jsonb; rejected boolean; before_count integer;
begin
  select * into actor from public.profiles where active
    and role in ('owner','admin','manager','staff') and organization_id is not null and unit_id is not null
    order by id limit 1;
  if actor.id is null then raise exception 'No authorized fixture context available'; end if;
  if has_function_privilege('anon','public.confirm_schedule_simulation(uuid,boolean)','EXECUTE') then
    raise exception 'Anonymous RPC execution must be denied'; end if;
  begin
    perform set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    insert into public.clientes(id,organization_id,unit_id,id_cliente,nome)
      values(client_id,actor.organization_id,actor.unit_id,'QA-'||client_id,'DWO temporary rollback test');
    insert into public.pets(id,organization_id,unit_id,client_id,id_pet,name)
      values(pet_id,actor.organization_id,actor.unit_id,client_id,'QA-'||pet_id,'DWO temporary rollback pet');
    insert into public.professionals(id,organization_id,unit_id,name)
      values(professional_id,actor.organization_id,actor.unit_id,'DWO temporary rollback professional');
    insert into public.services(id,organization_id,unit_id,name,duration_minutes,price)
      values(service_id,actor.organization_id,actor.unit_id,'Combo Higiene QA rollback',60,100);
    insert into public.client_packages(id,organization_id,unit_id,client_id,pet_id,code,contracted_baths,contracted_groomings,balance_baths,balance_groomings,contract_date,expiry_date)
      values(package_id,actor.organization_id,actor.unit_id,client_id,pet_id,'QA-'||package_id,4,1,4,1,current_date,current_date+30);
    insert into public.schedule_simulations(id,organization_id,unit_id,client_id,pet_id,client_package_id,service_id,professional_id,frequency,start_date,default_time,quantity,appointment_type)
      values(sim_id,actor.organization_id,actor.unit_id,client_id,pet_id,package_id,service_id,professional_id,'weekly',current_date+7,'10:00',2,'package');
    insert into public.schedule_simulation_items(simulation_id,scheduled_at,client_package_id,include_grooming,final_service_name)
      values(sim_id,start_at,package_id,false,'Combo Higiene'),(sim_id,start_at+interval '7 days',package_id,true,'Combo Higiene + Trimming');
    result:=public.confirm_schedule_simulation(sim_id,false);
    if result<>jsonb_build_object('created',2,'alreadyConfirmed',false) then raise exception 'Wrong confirmation result'; end if;
    if (select count(*) from public.schedule_simulation_items where simulation_id=sim_id and appointment_id is not null and status='created')<>2 then raise exception 'Missing item links'; end if;
    if (select count(*) from public.appointment_services where appointment_id in (select appointment_id from public.schedule_simulation_items where simulation_id=sim_id))<>2 then raise exception 'Missing service links'; end if;
    if not exists(select 1 from public.client_packages p where p.id=qa.package_id and balance_baths=4 and balance_groomings=1) then raise exception 'Confirmation consumed balance'; end if;
    result:=public.confirm_schedule_simulation(sim_id,false);
    if result<>jsonb_build_object('created',0,'alreadyConfirmed',true) then raise exception 'Repeat was not idempotent'; end if;
    rejected:=false;
    begin
      update public.schedule_simulation_items set scheduled_at=scheduled_at+interval '1 day' where simulation_id=sim_id;
    exception when others then
      if sqlerrm not like '%não está aberta%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Confirmed item remained editable'; end if;
    -- The first insertion succeeds, the second conflicts: the RPC must roll back both.
    insert into public.schedule_simulations(id,organization_id,unit_id,client_id,pet_id,client_package_id,service_id,professional_id,frequency,start_date,default_time,quantity,appointment_type)
      values(failure_sim,actor.organization_id,actor.unit_id,client_id,pet_id,package_id,service_id,professional_id,'weekly',current_date+8,'10:00',2,'package');
    insert into public.schedule_simulation_items(simulation_id,scheduled_at,client_package_id)
      values(failure_sim,start_at+interval '1 day',package_id),(failure_sim,start_at+interval '7 days',package_id);
    select count(*) into before_count from public.appointments a where a.pet_id=qa.pet_id;
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(failure_sim,false);
    exception when others then
      if sqlerrm not like '%já possui atendimento%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Expected conflict was accepted'; end if;
    if (select count(*) from public.appointments a where a.pet_id=qa.pet_id)<>before_count then raise exception 'Partial appointment persisted'; end if;
    if exists(select 1 from public.schedule_simulation_items where simulation_id=failure_sim and appointment_id is not null) then raise exception 'Partial item link persisted'; end if;
    insert into public.schedule_simulations(id,organization_id,unit_id,client_id,pet_id,client_package_id,service_id,professional_id,frequency,start_date,default_time,quantity,appointment_type)
      values(extra_sim,actor.organization_id,actor.unit_id,client_id,pet_id,package_id,service_id,professional_id,'weekly',current_date+10,'10:00',2,'package');
    insert into public.schedule_simulation_items(simulation_id,scheduled_at,client_package_id)
      values(extra_sim,start_at+interval '3 days',package_id),(extra_sim,start_at+interval '40 days',package_id);
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(extra_sim,false);
    exception when others then
      if sqlerrm not like '%fora da vigência%' then raise; end if; rejected:=true;
    end;
    if not rejected or (select count(*) from public.appointments a where a.pet_id=qa.pet_id)<>before_count then raise exception 'Expiry validation or rollback failed'; end if;
    update public.schedule_simulation_items set scheduled_at=start_at+interval '3 days 30 minutes'
      where simulation_id=extra_sim and scheduled_at=start_at+interval '40 days';
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(extra_sim,false);
    exception when others then
      if sqlerrm not like '%se sobrepõem%' then raise; end if; rejected:=true;
    end;
    if not rejected or (select count(*) from public.appointments a where a.pet_id=qa.pet_id)<>before_count then raise exception 'Internal overlap or rollback failed'; end if;
    update public.services set status='inactive' where id=qa.service_id;
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(extra_sim,false);
    exception when others then
      if sqlerrm not like '%Serviço ou duração inválidos%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Inactive service was accepted'; end if;
    update public.services set status='active' where id=qa.service_id;
    update public.professionals set is_active=false where id=qa.professional_id;
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(extra_sim,false);
    exception when others then
      if sqlerrm not like '%Profissional inválido%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Inactive professional was accepted'; end if;
    update public.professionals set is_active=true where id=qa.professional_id;
    update public.schedule_simulation_items set status=case when scheduled_at=start_at+interval '3 days' then 'warning' else 'ignored' end where simulation_id=extra_sim;
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(extra_sim,false);
    exception when others then
      if sqlerrm not like '%Nenhuma data válida%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Warning included without consent'; end if;
    result:=public.confirm_schedule_simulation(extra_sim,true);
    if result<>jsonb_build_object('created',1,'alreadyConfirmed',false) then raise exception 'Explicit warning selection failed'; end if;
    -- Two reservations already exist; three more must not use the same four credits.
    insert into public.schedule_simulations(id,organization_id,unit_id,client_id,pet_id,client_package_id,service_id,professional_id,frequency,start_date,default_time,quantity,appointment_type)
      values(other_sim,actor.organization_id,actor.unit_id,client_id,pet_id,package_id,service_id,professional_id,'weekly',current_date+9,'10:00',3,'package');
    insert into public.schedule_simulation_items(simulation_id,scheduled_at,client_package_id)
      values(other_sim,start_at+interval '2 days',package_id),(other_sim,start_at+interval '3 days',package_id),(other_sim,start_at+interval '4 days',package_id);
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(other_sim,false);
    exception when others then
      if sqlerrm not like '%Saldo insuficiente%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Reserved balance was reused'; end if;
    perform set_config('request.jwt.claims','{}',true);
    rejected:=false;
    begin
      perform public.confirm_schedule_simulation(sim_id,false);
    exception when others then
      if sqlerrm not like '%equipe autorizada%' then raise; end if; rejected:=true;
    end;
    if not rejected then raise exception 'Missing identity was accepted'; end if;
    raise exception using errcode='PZ001',message='Rollback successful fixtures';
  exception when sqlstate 'PZ001' then null;
  end;
  if exists(select 1 from public.clientes c where c.id=client_id) then raise exception 'Fixture cleanup failed'; end if;
end $test$;
