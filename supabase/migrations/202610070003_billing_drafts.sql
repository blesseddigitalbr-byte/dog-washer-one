-- Drafts are not provider charges. No money movement is performed by this migration.
create table public.billing_drafts (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  client_id uuid not null references public.clientes(id),
  appointment_id uuid references public.appointments(id),
  client_package_id uuid references public.client_packages(id),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 100000000),
  billing_type text not null check (billing_type in ('PIX','BOLETO','CREDIT_CARD')),
  due_date date not null,
  description text not null check (length(description) between 1 and 500),
  status text not null default 'draft' check (status in ('draft','issuing','issued','needs_review','cancelled')),
  provider_payment_id text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (appointment_id is null or client_package_id is null)
);
alter table public.billing_drafts enable row level security;
alter table public.billing_drafts force row level security;
create policy billing_drafts_read on public.billing_drafts for select to authenticated
using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id()
  and exists (select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin','manager')));
create policy billing_drafts_insert on public.billing_drafts for insert to authenticated
with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id()
  and created_by = auth.uid() and status = 'draft' and provider_payment_id is null
  and exists (select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin','manager')));

create function public.validate_billing_draft_origin() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists(select 1 from public.clientes where id = new.client_id and organization_id = new.organization_id and unit_id = new.unit_id) then
    raise exception 'Invalid billing client';
  end if;
  if new.appointment_id is not null and not exists(select 1 from public.appointments where id = new.appointment_id and client_id = new.client_id and organization_id = new.organization_id and unit_id = new.unit_id) then
    raise exception 'Invalid billing appointment';
  end if;
  if new.client_package_id is not null and not exists(select 1 from public.client_packages where id = new.client_package_id and client_id = new.client_id and organization_id = new.organization_id and unit_id = new.unit_id) then
    raise exception 'Invalid billing package';
  end if;
  return new;
end;
$$;
create trigger validate_billing_draft_origin before insert or update on public.billing_drafts
for each row execute function public.validate_billing_draft_origin();
