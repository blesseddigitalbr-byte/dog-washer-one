alter table public.appointments
  add column if not exists include_grooming boolean not null default false,
  add column if not exists planned_service_name text;

create or replace function public.complete_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security invoker
set search_path = ''
as $$
declare
  apt public.appointments;
  service_name text;
  service_category text;
  planned_service text;
  session_kind text;
  result public.appointments;
begin
  select * into apt from public.appointments
  where id = p_appointment_id
    and organization_id = public.current_organization_id()
    and unit_id = public.current_unit_id()
  for update;

  if apt.id is null then raise exception 'Agendamento não encontrado'; end if;
  if apt.status = 'completed' then return apt; end if;
  if apt.status <> 'in_progress' then raise exception 'O atendimento precisa estar em andamento'; end if;

  select name, category into service_name, service_category
  from public.services where id = apt.service_id;

  planned_service := lower(
    coalesce(apt.planned_service_name, '') || ' ' ||
    coalesce(service_category, '') || ' ' ||
    coalesce(service_name, '')
  );

  session_kind := case
    when apt.include_grooming is true
      or planned_service like '%tosa%'
      or planned_service like '%trim%' then 'grooming'
    else 'bath'
  end;

  if apt.client_package_id is not null then
    if session_kind = 'grooming' then
      update public.client_packages set
        balance_groomings = balance_groomings - 1,
        updated_at = now()
      where id = apt.client_package_id and status = 'active' and balance_groomings > 0;
    else
      update public.client_packages set
        balance_baths = balance_baths - 1,
        updated_at = now()
      where id = apt.client_package_id and status = 'active' and balance_baths > 0;
    end if;
    if not found then raise exception 'Pacote sem saldo para este serviço'; end if;

    insert into public.package_sessions(package_id, client_package_id, appointment_id, service_id, session_type)
    select package_id, id, apt.id, apt.service_id, session_kind from public.client_packages where id = apt.client_package_id
    on conflict (appointment_id, service_id) do nothing;

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
    concat_ws(E'\n', apt.notes, nullif(apt.planned_service_name, '')),
    auth.uid()
  ) on conflict (appointment_id) do nothing;

  return result;
end
$$;

grant execute on function public.complete_appointment(uuid) to authenticated;
