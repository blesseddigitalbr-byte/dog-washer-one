begin;
-- Serialize edits with confirmation. Confirmed items remain traceable and immutable.
create function public.guard_simulation_item_edit() returns trigger
language plpgsql security invoker set search_path='' as $$
declare parent public.schedule_simulations;
begin
  select * into parent from public.schedule_simulations
  where id=case when tg_op='INSERT' then new.simulation_id else old.simulation_id end for update;
  if parent.id is null or parent.status<>'draft' then raise exception 'Simulação não está aberta para edição'; end if;
  if tg_op='UPDATE' and new.simulation_id is distinct from old.simulation_id then
    raise exception 'Não é permitido mover item para outra simulação';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end $$;
create trigger guard_simulation_item_edit before insert or update or delete on public.schedule_simulation_items
for each row execute function public.guard_simulation_item_edit();

create function public.confirm_schedule_simulation(p_id uuid,p_include_warnings boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  sim public.schedule_simulations;
  item public.schedule_simulation_items;
  svc public.services;
  pkg public.client_packages;
  apt_id uuid;
  selected_count integer; grooming_count integer; created_count integer:=0;
  previous_end timestamptz;
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and active
    and role in ('owner','admin','manager','staff')) then raise exception 'Confirmação restrita à equipe autorizada'; end if;
  select * into sim from public.schedule_simulations where id=p_id
    and organization_id=public.current_organization_id() and unit_id=public.current_unit_id() for update;
  if sim.id is null then raise exception 'Simulação não encontrada'; end if;
  if sim.status='confirmed' then
    return pg_catalog.jsonb_build_object('created',0,'alreadyConfirmed',true);
  end if;
  if sim.status<>'draft' then raise exception 'Simulação não está aberta'; end if;
  if not exists(select 1 from public.pets where id=sim.pet_id and client_id=sim.client_id
    and unit_id=sim.unit_id and organization_id=sim.organization_id) then raise exception 'Pet e tutor incompatíveis'; end if;
  select * into svc from public.services where id=sim.service_id and unit_id=sim.unit_id;
  if svc.id is null or svc.duration_minutes is null or svc.duration_minutes<=0 then raise exception 'Serviço ou duração inválidos'; end if;
  if not exists(select 1 from public.professionals where id=sim.professional_id and unit_id=sim.unit_id)
    then raise exception 'Profissional inválido'; end if;
  perform 1 from public.schedule_simulation_items where simulation_id=sim.id for update;
  select count(*),count(*) filter(where include_grooming) into selected_count,grooming_count
    from public.schedule_simulation_items where simulation_id=sim.id
      and (status='valid' or (p_include_warnings and status='warning'));
  if selected_count=0 then raise exception 'Nenhuma data válida selecionada'; end if;
  if sim.client_package_id is not null then
    select * into pkg from public.client_packages where id=sim.client_package_id
      and organization_id=sim.organization_id and unit_id=sim.unit_id
      and client_id=sim.client_id and pet_id=sim.pet_id for update;
    if pkg.id is null or pkg.status<>'active' then raise exception 'Pacote não está ativo para este tutor/pet'; end if;
    if selected_count>pkg.balance_baths or grooming_count>pkg.balance_groomings then raise exception 'Saldo insuficiente para as datas selecionadas'; end if;
  end if;
  -- Match the agenda guard lock, so batches do not race for the same professional.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(sim.unit_id::text || ':' || sim.professional_id::text,0));
  for item in select * from public.schedule_simulation_items where simulation_id=sim.id
    and (status='valid' or (p_include_warnings and status='warning')) order by scheduled_at,id
  loop
    if item.appointment_id is not null then raise exception 'Item já vinculado: revisão necessária'; end if;
    if item.client_package_id is distinct from sim.client_package_id then raise exception 'Origem do pacote divergente'; end if;
    if previous_end is not null and item.scheduled_at<previous_end then raise exception 'Datas da simulação se sobrepõem'; end if;
    previous_end:=item.scheduled_at+pg_catalog.make_interval(mins=>svc.duration_minutes);
    if pkg.id is not null and ((item.scheduled_at at time zone 'America/Sao_Paulo')::date<pkg.contract_date
      or (pkg.expiry_date is not null and (item.scheduled_at at time zone 'America/Sao_Paulo')::date>pkg.expiry_date)) then
      raise exception 'Data fora da vigência do pacote';
    end if;
    if exists(select 1 from public.appointments a where a.unit_id=sim.unit_id and a.pet_id=sim.pet_id
      and a.status in ('pending','confirmed','in_progress') and a.appointment_date<previous_end
      and a.appointment_date+pg_catalog.make_interval(mins=>coalesce(a.duration_minutes,60))>item.scheduled_at)
      then raise exception 'Pet já possui atendimento nesse período'; end if;
    insert into public.appointments(organization_id,unit_id,client_id,pet_id,service_id,professional_id,
      client_package_id,appointment_type,appointment_date,start_time,end_time,duration_minutes,total_price,
      recurrence_rule,status,include_grooming,planned_service_name,notes,created_by)
    values(sim.organization_id,sim.unit_id,sim.client_id,sim.pet_id,sim.service_id,sim.professional_id,
      sim.client_package_id,sim.appointment_type,item.scheduled_at,
      pg_catalog.to_char(item.scheduled_at at time zone 'America/Sao_Paulo','HH24:MI'),
      pg_catalog.to_char(previous_end at time zone 'America/Sao_Paulo','HH24:MI'),svc.duration_minutes,
      coalesce(svc.price,0),sim.frequency,'pending',coalesce(item.include_grooming,false),item.final_service_name,sim.notes,auth.uid())
    returning id into apt_id;
    insert into public.appointment_services(appointment_id,service_id,unit_price,duration_minutes)
      values(apt_id,sim.service_id,coalesce(svc.price,0),svc.duration_minutes);
    update public.schedule_simulation_items set status='created',appointment_id=apt_id where id=item.id;
    created_count:=created_count+1;
  end loop;
  update public.schedule_simulations set status='confirmed',confirmed_at=now(),updated_at=now() where id=sim.id;
  -- No balance decrement, payment write or external invitation in this transaction.
  return pg_catalog.jsonb_build_object('created',created_count,'alreadyConfirmed',false);
end $$;
revoke all on function public.confirm_schedule_simulation(uuid,boolean) from public,anon;
grant execute on function public.confirm_schedule_simulation(uuid,boolean) to authenticated;
commit;
