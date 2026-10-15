-- Preserve execution logic; require an active authorized unit inside privileged routines.
create or replace function private.require_active_unit_membership()
returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not exists(
  select 1 from public.profiles p
  join public.user_unit_access a on a.user_id=p.id and a.organization_id=p.organization_id and a.unit_id=p.unit_id and a.active
  join public.units u on u.id=p.unit_id and u.organization_id=p.organization_id and u.is_active
  where p.id=auth.uid() and p.active
 ) then raise exception 'Active unit access required' using errcode='42501'; end if;
end $$;
revoke all on function private.require_active_unit_membership() from public,anon,authenticated;
CREATE OR REPLACE FUNCTION public.complete_appointment(p_appointment_id uuid)
 RETURNS appointments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  apt public.appointments;
  result public.appointments;
  service_text text;
  consume_grooming boolean;
  consume_bath boolean;
  chosen_package uuid;
begin
  perform private.require_active_unit_membership();
  if not exists(select 1 from public.profiles where id=auth.uid() and active
    and role in ('owner','admin','manager','staff')) then
    raise exception 'Baixa restrita à equipe autorizada';
  end if;
  select * into apt from public.appointments where id=p_appointment_id
    and organization_id=public.current_organization_id() and unit_id=public.current_unit_id() for update;
  if apt.id is null then raise exception 'Agendamento não encontrado'; end if;
  if apt.execution_reversed_at is not null then raise exception 'Baixa revertida não pode ser concluída novamente'; end if;
  if apt.status='completed' then return apt; end if;
  if apt.status<>'in_progress' then raise exception 'O atendimento precisa estar em andamento'; end if;
  if exists(select 1 from public.package_sessions where appointment_id=apt.id)
    or exists(select 1 from public.visit_history where appointment_id=apt.id) then
    raise exception 'Histórico incompatível com a baixa: revisão necessária';
  end if;

  select lower(concat_ws(' ',apt.planned_service_name,name,category)) into service_text
    from public.services where id=apt.service_id;
  service_text:=coalesce(service_text,lower(coalesce(apt.planned_service_name,'')));
  -- Hygiene is included in every visit; additional grooming is an explicit choice.
  consume_grooming:=coalesce(apt.include_grooming,false);
  consume_bath:=true;
  if apt.client_package_id is not null then
    -- One allocation at a time per tutor/pet. Never mix credits from two contracts.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
      apt.unit_id::text || ':' || apt.client_id::text || ':' || apt.pet_id::text,0));
    if not exists(select 1 from public.client_packages where id=apt.client_package_id
      and organization_id=apt.organization_id and unit_id=apt.unit_id
      and client_id=apt.client_id and pet_id=apt.pet_id and status<>'cancelled') then
      raise exception 'Origem do pacote inválida ou cancelada';
    end if;
    select id into chosen_package from public.client_packages
    where organization_id=apt.organization_id and unit_id=apt.unit_id
      and client_id=apt.client_id and pet_id=apt.pet_id and status='active'
      and contract_date <= (now() at time zone 'America/Sao_Paulo')::date
      and (expiry_date is null or expiry_date >= (now() at time zone 'America/Sao_Paulo')::date)
      and (not consume_bath or balance_baths>0) and (not consume_grooming or balance_groomings>0)
    order by expiry_date asc nulls last,contract_date asc,created_at asc,id asc
    limit 1 for update;
    if chosen_package is null then raise exception 'Nenhum pacote válido com saldo para todos os serviços'; end if;
    insert into public.appointment_package_allocations(appointment_id,organization_id,unit_id,
      requested_package_id,consumed_package_id,created_by)
    values(apt.id,apt.organization_id,apt.unit_id,apt.client_package_id,chosen_package,auth.uid());
    if chosen_package is distinct from apt.client_package_id then
      update public.appointments set client_package_id=chosen_package where id=apt.id;
      apt.client_package_id:=chosen_package;
    end if;
    update public.client_packages set
      balance_baths=balance_baths-case when consume_bath then 1 else 0 end,
      balance_groomings=balance_groomings-case when consume_grooming then 1 else 0 end,
      updated_at=now()
    where id=apt.client_package_id and organization_id=apt.organization_id and unit_id=apt.unit_id
      and client_id=apt.client_id and pet_id=apt.pet_id and status='active'
      and (expiry_date is null or expiry_date >= (now() at time zone 'America/Sao_Paulo')::date)
      and contract_date <= (now() at time zone 'America/Sao_Paulo')::date
      and (not consume_bath or balance_baths>0) and (not consume_grooming or balance_groomings>0);
    if not found then raise exception 'Pacote inválido, fora da validade ou sem saldo para os serviços'; end if;
    insert into public.package_sessions(package_id,client_package_id,appointment_id,session_type)
    select package_id,id,apt.id,
      case when consume_bath and consume_grooming then 'bath_grooming' when consume_grooming then 'grooming' else 'bath' end
    from public.client_packages where id=apt.client_package_id;
    update public.client_packages set status='consumed',updated_at=now()
      where id=apt.client_package_id and balance_baths=0 and balance_groomings=0;
  end if;
  update public.appointments set status='completed',completed_at=now(),updated_at=now()
    where id=apt.id returning * into result;
  insert into public.visit_history(organization_id,unit_id,appointment_id,client_id,pet_id,service_id,
    professional_id,client_package_id,visited_at,notes,created_by)
  values(apt.organization_id,apt.unit_id,apt.id,apt.client_id,apt.pet_id,apt.service_id,
    apt.professional_id,apt.client_package_id,now(),concat_ws(E'\n',apt.notes,nullif(apt.planned_service_name,'')),auth.uid());
  return result;
end $function$
;
CREATE OR REPLACE FUNCTION public.reverse_appointment_execution(p_id uuid, p_reason text)
 RETURNS appointment_reversals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  apt public.appointments;
  result public.appointment_reversals;
  consumption public.package_sessions;
  bath integer := 0; grooming integer := 0; count_sessions integer;
begin
  perform private.require_active_unit_membership();
  if not exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin','manager')) then raise exception 'Reversão restrita à gestão'; end if;
  if p_reason is null or length(trim(p_reason)) not between 3 and 500 then raise exception 'Informe motivo entre 3 e 500 caracteres'; end if;
  select * into apt from public.appointments where id=p_id and organization_id=public.current_organization_id()
    and unit_id=public.current_unit_id() for update;
  if apt.id is null then raise exception 'Atendimento não encontrado'; end if;
  select * into result from public.appointment_reversals where appointment_id=apt.id;
  if result.appointment_id is not null then return result; end if;
  if apt.status <> 'completed' then raise exception 'Somente baixa concluída pode ser revertida'; end if;
  if apt.client_package_id is not null then
    select count(*) into count_sessions from public.package_sessions where appointment_id=apt.id;
    if count_sessions <> 1 then raise exception 'Consumo ausente ou ambíguo: revisão necessária'; end if;
    select * into consumption from public.package_sessions where appointment_id=apt.id;
    if consumption.client_package_id is distinct from apt.client_package_id then raise exception 'Origem do consumo divergente'; end if;
    if consumption.session_type not in ('bath','grooming','bath_grooming') then raise exception 'Tipo de consumo não reconhecido'; end if;
    bath := case when consumption.session_type in ('bath','bath_grooming') then 1 else 0 end;
    grooming := case when consumption.session_type in ('grooming','bath_grooming') then 1 else 0 end;
    update public.client_packages set balance_baths=balance_baths+bath,balance_groomings=balance_groomings+grooming,
      status=case when status='consumed' then 'active' else status end,updated_at=now()
    where id=apt.client_package_id and organization_id=apt.organization_id and unit_id=apt.unit_id
      and client_id=apt.client_id and pet_id=apt.pet_id
      and balance_baths+bath<=contracted_baths and balance_groomings+grooming<=contracted_groomings;
    if not found then raise exception 'Saldo ou origem incompatíveis com reversão'; end if;
  elsif exists(select 1 from public.package_sessions where appointment_id=apt.id) then
    raise exception 'Consumo sem pacote vinculado: revisão necessária';
  end if;
  insert into public.appointment_reversals(appointment_id,organization_id,unit_id,reason,restored_baths,restored_groomings,academic_review_required,created_by)
  values(apt.id,apt.organization_id,apt.unit_id,trim(p_reason),bath,grooming,apt.student_id is not null,auth.uid()) returning * into result;
  update public.appointments set execution_reversed_at=now(),updated_at=now() where id=apt.id;
  if apt.student_id is not null then
    update public.academic_practice_outbox set delivery_status='needs_review' where appointment_id=apt.id;
  end if;
  -- Preserve consumption/visit history and original expiry; no provider call or financial refund.
  return result;
end $function$
;

create or replace function private.guard_photo_record_namespace()
returns trigger language plpgsql security invoker set search_path='' as $$
declare prefix text; filename text;
begin
 if tg_op='UPDATE' and new.photo_storage_key is not distinct from old.photo_storage_key and new.id=old.id and new.organization_id=old.organization_id then return new; end if;
 if new.photo_storage_key is null then return new; end if;
 prefix:=new.organization_id::text || '/' || tg_argv[0] || '/' || new.id::text || '/';
 if prefix is null or left(new.photo_storage_key,length(prefix))<>prefix then
  raise exception 'Photo must belong to this record' using errcode='42501';
 end if;
 filename:=substring(new.photo_storage_key from length(prefix)+1);
 if filename in ('','.', '..') or filename ~ '[/\\?#%[:cntrl:]]' or length(new.photo_storage_key)>512 then
  raise exception 'Invalid photo object reference' using errcode='42501';
 end if;
 return new;
end $$;
revoke all on function private.guard_photo_record_namespace() from public,anon,authenticated;
create trigger zz_photo_record_namespace before insert or update on public.pets for each row execute function private.guard_photo_record_namespace('pets');
create trigger zz_photo_record_namespace before insert or update on public.clientes for each row execute function private.guard_photo_record_namespace('clients');
