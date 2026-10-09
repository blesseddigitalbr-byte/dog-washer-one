begin;

create table public.appointment_package_allocations (
  appointment_id uuid primary key references public.appointments(id),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  requested_package_id uuid not null references public.client_packages(id),
  consumed_package_id uuid not null references public.client_packages(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.appointment_package_allocations enable row level security;
alter table public.appointment_package_allocations force row level security;
create policy package_allocation_read on public.appointment_package_allocations for select to authenticated
using(organization_id=public.current_organization_id() and unit_id=public.current_unit_id());
revoke insert,update,delete on public.appointment_package_allocations from authenticated,anon;

-- History is written only by the authorized execution procedure, never by clients.
revoke insert, update, delete on public.package_sessions, public.visit_history from authenticated, anon;
drop policy if exists package_sessions_appointment_tenant on public.package_sessions;
create policy package_sessions_read on public.package_sessions for select to authenticated
using(exists(select 1 from public.appointments a where a.id=package_sessions.appointment_id
  and a.organization_id=public.current_organization_id() and a.unit_id=public.current_unit_id()));
drop policy if exists visit_history_tenant on public.visit_history;
create policy visit_history_read on public.visit_history for select to authenticated
using(organization_id=public.current_organization_id() and unit_id=public.current_unit_id());

create or replace function public.complete_appointment(p_appointment_id uuid)
returns public.appointments language plpgsql security definer set search_path='' as $$
declare
  apt public.appointments;
  result public.appointments;
  service_text text;
  consume_grooming boolean;
  consume_bath boolean;
  chosen_package uuid;
begin
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
  consume_grooming:=apt.include_grooming or service_text like '%tosa%' or service_text like '%trim%';
  consume_bath:=not consume_grooming or apt.include_grooming or service_text like '%banho%'
    or service_text like '%higiene%' or service_text like '%combo%';
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
    insert into public.package_sessions(package_id,client_package_id,appointment_id,service_id,session_type)
    select package_id,id,apt.id,apt.service_id,
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
end $$;
revoke all on function public.complete_appointment(uuid) from public, anon;
grant execute on function public.complete_appointment(uuid) to authenticated;
commit;
