begin;
create table public.academic_practice_outbox (
  appointment_id uuid primary key references public.appointments(id),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  student_id uuid not null references public.students(id),
  completed_at timestamptz not null,
  delivery_status text not null default 'awaiting_mapping' check (delivery_status in ('awaiting_mapping','queued','delivered','needs_review')),
  portal_reference_id text,
  created_at timestamptz not null default now()
);
alter table public.academic_practice_outbox enable row level security;
alter table public.academic_practice_outbox force row level security;
create policy academic_practice_outbox_read on public.academic_practice_outbox for select to authenticated
using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id());
-- No authenticated INSERT/UPDATE policy: only the execution trigger may enqueue.
create function public.enqueue_academic_practice() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if NEW.status = 'completed' and NEW.student_id is not null and NEW.completed_at is not null then
    insert into public.academic_practice_outbox (appointment_id, organization_id, unit_id, student_id, completed_at)
    values (NEW.id, NEW.organization_id, NEW.unit_id, NEW.student_id, NEW.completed_at)
    on conflict (appointment_id) do nothing;
  end if;
  return NEW;
end $$;
revoke all on function public.enqueue_academic_practice() from public;
create trigger enqueue_academic_practice after insert or update on public.appointments
for each row execute function public.enqueue_academic_practice();
-- Backfill creates operational references only, never student attendance or grades.
insert into public.academic_practice_outbox (appointment_id, organization_id, unit_id, student_id, completed_at)
select id, organization_id, unit_id, student_id, completed_at from public.appointments
where status = 'completed' and student_id is not null and completed_at is not null
and organization_id is not null and unit_id is not null
on conflict (appointment_id) do nothing;
commit;
