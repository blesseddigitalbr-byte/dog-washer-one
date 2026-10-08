begin;
alter table public.appointments add column if not exists student_id uuid references public.students(id);
alter table public.appointments add constraint appointment_student_requires_professional check (student_id is null or professional_id is not null);
create or replace function public.validate_appointment_student() returns trigger language plpgsql set search_path = public as $$
declare s public.students; p public.pets;
begin
  if TG_OP = 'UPDATE' and OLD.status = 'completed' and NEW.student_id is distinct from OLD.student_id then
    raise exception 'Aluno de atendimento concluído não pode ser alterado';
  end if;
  if NEW.student_id is null then return NEW; end if;
  select * into s from public.students where id = NEW.student_id;
  select * into p from public.pets where id = NEW.pet_id;
  if s.id is null or s.unit_id is distinct from NEW.unit_id or not s.is_authorized or s.academic_status <> 'active' then
    raise exception 'Aluno não autorizado nesta unidade';
  end if;
  if s.instructor_id is distinct from NEW.professional_id then raise exception 'Supervisor divergente do cadastro do aluno'; end if;
  if coalesce(s.allowed_services, '[]')::jsonb <> '[]'::jsonb and not (s.allowed_services::jsonb ? NEW.service_id::text) then
    raise exception 'Aluno não autorizado para este serviço';
  end if;
  if coalesce(s.allowed_dog_sizes, '[]')::jsonb <> '[]'::jsonb and not (s.allowed_dog_sizes::jsonb ? p.size) then
    raise exception 'Aluno não autorizado para este porte';
  end if;
  return NEW;
end $$;
create trigger appointment_student_guard before insert or update on public.appointments for each row execute function public.validate_appointment_student();
commit;
