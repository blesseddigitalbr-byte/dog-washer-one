-- Uma visita com banho e tosa consome os dois saldos na mesma transação.
alter table public.package_sessions
  add column if not exists service_id uuid references public.services(id);

create or replace function public.complete_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  apt public.appointments;
  result public.appointments;
  service_text text;
  consume_grooming boolean;
  consume_bath boolean;
begin
  select * into apt from public.appointments
  where id = p_appointment_id
    and organization_id = public.current_organization_id()
    and unit_id = public.current_unit_id()
  for update;

  if apt.id is null then raise exception 'Agendamento não encontrado'; end if;
  if apt.status = 'completed' then return apt; end if;
  if apt.status <> 'in_progress' then raise exception 'O atendimento precisa estar em andamento'; end if;

  select lower(concat_ws(' ', apt.planned_service_name, name, category))
  into service_text from public.services where id = apt.service_id;
  service_text := coalesce(service_text, lower(coalesce(apt.planned_service_name, '')));
  consume_grooming := apt.include_grooming or service_text like '%tosa%' or service_text like '%trim%';
  consume_bath := not consume_grooming or apt.include_grooming
    or service_text like '%banho%' or service_text like '%higiene%' or service_text like '%combo%';

  if apt.client_package_id is not null then
    update public.client_packages set
      balance_baths = balance_baths - case when consume_bath then 1 else 0 end,
      balance_groomings = balance_groomings - case when consume_grooming then 1 else 0 end,
      updated_at = now()
    where id = apt.client_package_id
      and organization_id = apt.organization_id and unit_id = apt.unit_id
      and client_id = apt.client_id and pet_id = apt.pet_id
      and status = 'active'
      and (not consume_bath or balance_baths > 0)
      and (not consume_grooming or balance_groomings > 0);
    if not found then
      raise exception 'Pacote inválido ou sem saldo para todos os serviços deste atendimento';
    end if;

    insert into public.package_sessions(package_id, client_package_id, appointment_id, service_id, session_type)
    select package_id, id, apt.id, apt.service_id,
      case when consume_bath and consume_grooming then 'bath_grooming'
        when consume_grooming then 'grooming' else 'bath' end
    from public.client_packages where id = apt.client_package_id;

    update public.client_packages set status = 'consumed', updated_at = now()
    where id = apt.client_package_id and balance_baths = 0 and balance_groomings = 0;
  end if;

  update public.appointments set status = 'completed', completed_at = now(), updated_at = now()
  where id = apt.id returning * into result;

  insert into public.visit_history(
    organization_id, unit_id, appointment_id, client_id, pet_id, service_id,
    professional_id, client_package_id, visited_at, notes, created_by
  ) values (
    apt.organization_id, apt.unit_id, apt.id, apt.client_id, apt.pet_id, apt.service_id,
    apt.professional_id, apt.client_package_id, now(),
    concat_ws(E'\n', apt.notes, nullif(apt.planned_service_name, '')), auth.uid()
  ) on conflict (appointment_id) do nothing;
  return result;
end
$$;

grant execute on function public.complete_appointment(uuid) to authenticated;
