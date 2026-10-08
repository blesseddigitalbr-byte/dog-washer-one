-- Prevent concurrent bookings and preserve the executor/value used by settlement.
-- Does not modify existing appointments or move money.
create or replace function public.guard_appointment_execution()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and old.status = 'completed' and (
    new.status is distinct from old.status or
    new.professional_id is distinct from old.professional_id or
    new.client_id is distinct from old.client_id or
    new.pet_id is distinct from old.pet_id or
    new.service_id is distinct from old.service_id or
    new.client_package_id is distinct from old.client_package_id or
    new.total_price is distinct from old.total_price or
    new.appointment_date is distinct from old.appointment_date or
    new.unit_id is distinct from old.unit_id or
    new.organization_id is distinct from old.organization_id
  ) then
    raise exception 'Atendimento concluído: executor, origem e valor não podem ser alterados';
  end if;
  if new.status = 'completed' and new.professional_id is null then
    raise exception 'Informe o profissional que executou o serviço';
  end if;
  if new.status in ('pending', 'confirmed', 'in_progress') then
    if new.professional_id is null or new.unit_id is null or new.duration_minutes is null or new.duration_minutes <= 0 then
      raise exception 'Agendamento requer unidade, profissional e duração positiva';
    end if;
    -- Serialize bookings for the same professional/unit, including simulator writes.
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.unit_id::text || ':' || new.professional_id::text, 0));
    if exists (
      select 1 from public.appointments a
      where a.unit_id = new.unit_id and a.professional_id = new.professional_id
        and a.id <> new.id and a.status in ('pending', 'confirmed', 'in_progress')
        and a.appointment_date < new.appointment_date + pg_catalog.make_interval(mins => new.duration_minutes)
        and a.appointment_date + pg_catalog.make_interval(mins => coalesce(a.duration_minutes, 60)) > new.appointment_date
    ) then
      raise exception 'O profissional já possui atendimento nesse horário';
    end if;
  end if;
  return new;
end;
$$;
create trigger guard_appointment_execution before insert or update on public.appointments
for each row execute function public.guard_appointment_execution();
