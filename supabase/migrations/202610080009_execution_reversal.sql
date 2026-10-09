begin;
create table public.appointment_reversals (
  appointment_id uuid primary key references public.appointments(id),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  reason text not null check(length(reason) between 3 and 500),
  restored_baths integer not null,
  restored_groomings integer not null,
  financial_review_required boolean not null default true,
  academic_review_required boolean not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.appointment_reversals enable row level security;
alter table public.appointment_reversals force row level security;
create policy reversal_read on public.appointment_reversals for select to authenticated
using(organization_id=public.current_organization_id() and unit_id=public.current_unit_id());
alter table public.appointments add column execution_reversed_at timestamptz;

-- Completed execution remains an immutable historical fact; reversal is a separate event.
create function public.reverse_appointment_execution(p_id uuid,p_reason text)
returns public.appointment_reversals language plpgsql security definer set search_path='' as $$
declare
  apt public.appointments;
  result public.appointment_reversals;
  consumption public.package_sessions;
  bath integer := 0; grooming integer := 0; count_sessions integer;
begin
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
end $$;
revoke all on function public.reverse_appointment_execution(uuid,text) from public;
grant execute on function public.reverse_appointment_execution(uuid,text) to authenticated;

create function public.guard_reversed_execution() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.execution_reversed_at is distinct from old.execution_reversed_at then
    if old.execution_reversed_at is not null or new.execution_reversed_at is null or
      not exists(select 1 from public.appointment_reversals where appointment_id=old.id and organization_id=old.organization_id and unit_id=old.unit_id) then
      raise exception 'Reversão somente pelo procedimento auditado';
    end if;
  end if;
  return new;
end $$;
create trigger guard_reversed_execution before update on public.appointments for each row execute function public.guard_reversed_execution();
commit;
