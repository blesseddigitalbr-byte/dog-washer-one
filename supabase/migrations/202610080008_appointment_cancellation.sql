begin;
create table public.appointment_cancellations (
  appointment_id uuid primary key references public.appointments(id),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  previous_status text not null,
  reason text not null check(length(reason) between 3 and 500),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.appointment_cancellations enable row level security;
alter table public.appointment_cancellations force row level security;
create policy cancellation_read on public.appointment_cancellations for select to authenticated
using(organization_id=public.current_organization_id() and unit_id=public.current_unit_id());
create policy cancellation_insert on public.appointment_cancellations for insert to authenticated
with check(organization_id=public.current_organization_id() and unit_id=public.current_unit_id() and created_by=auth.uid());
create function public.cancel_appointment(p_id uuid,p_reason text)
returns public.appointments language plpgsql security invoker set search_path='' as $$
declare apt public.appointments; result public.appointments;
begin
  if length(trim(p_reason)) not between 3 and 500 then raise exception 'Informe motivo entre 3 e 500 caracteres'; end if;
  select * into apt from public.appointments where id=p_id and organization_id=public.current_organization_id()
    and unit_id=public.current_unit_id() for update;
  if apt.id is null then raise exception 'Agendamento não encontrado'; end if;
  if apt.status='cancelled' then return apt; end if;
  if apt.status not in ('pending','confirmed','in_progress') then raise exception 'Baixa concluída exige correção auditada, não cancelamento comum'; end if;
  if exists(select 1 from public.package_sessions where appointment_id=apt.id) then
    raise exception 'Consumo encontrado antes da conclusão: requer conferência e reversão controlada';
  end if;
  insert into public.appointment_cancellations(appointment_id,organization_id,unit_id,previous_status,reason,created_by)
  values(apt.id,apt.organization_id,apt.unit_id,apt.status,trim(p_reason),auth.uid());
  update public.appointments set status='cancelled',cancellation_reason=trim(p_reason),cancelled_at=now(),updated_at=now()
  where id=apt.id returning * into result;
  -- No changes to package, billing, payment, split or subscription.
  return result;
end $$;
revoke all on function public.cancel_appointment(uuid,text) from public;
grant execute on function public.cancel_appointment(uuid,text) to authenticated;
commit;
