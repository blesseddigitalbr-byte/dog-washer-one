begin;
create table public.external_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  billing_draft_id uuid unique references public.billing_drafts(id),
  number text not null check(length(number) between 1 and 50),
  access_key text not null check(access_key ~ '^[0-9]{50}$'),
  issued_date date not null,
  amount_cents bigint not null check(amount_cents > 0),
  service_description text not null check(length(service_description) between 5 and 2000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(organization_id, access_key)
);
alter table public.external_invoices enable row level security;
alter table public.external_invoices force row level security;
create policy external_invoices_read on public.external_invoices for select to authenticated
using(organization_id=public.current_organization_id() and unit_id=public.current_unit_id()
and exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin','manager')));
-- Writes are server-only; historic notes may be registered before billing is identified.
create function public.guard_invoice_origin() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.billing_draft_id is null then return new; end if;
  perform 1 from public.billing_drafts where id=new.billing_draft_id and organization_id=new.organization_id and unit_id=new.unit_id for update;
  if not found then raise exception 'Cobrança fora da organização/unidade'; end if;
  if tg_table_name='invoice_drafts' then
    if exists(select 1 from public.external_invoices where billing_draft_id=new.billing_draft_id) then raise exception 'Nota externa já registrada'; end if;
  else
    if exists(select 1 from public.invoice_drafts where billing_draft_id=new.billing_draft_id and status <> 'awaiting_fiscal_validation') then raise exception 'Nota DWO em processamento ou emitida'; end if;
    update public.invoice_drafts set status='cancelled' where billing_draft_id=new.billing_draft_id and status='awaiting_fiscal_validation';
  end if;
  return new;
end $$;
create trigger external_invoice_origin before insert on public.external_invoices for each row execute function public.guard_invoice_origin();
create trigger draft_invoice_origin before insert on public.invoice_drafts for each row execute function public.guard_invoice_origin();
commit;
