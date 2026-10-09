begin;
create table public.invoice_drafts (
  id uuid primary key default gen_random_uuid(),
  billing_draft_id uuid not null unique references public.billing_drafts(id),
  organization_id uuid not null references public.organizations(id),
  unit_id uuid not null references public.units(id),
  amount_cents bigint not null check (amount_cents > 0),
  service_description text not null check (length(service_description) between 5 and 2000),
  effective_date date not null,
  status text not null default 'awaiting_fiscal_validation' check (status in ('awaiting_fiscal_validation','issuing','scheduled','authorized','needs_review','cancelled')),
  provider_invoice_id text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.invoice_drafts enable row level security;
alter table public.invoice_drafts force row level security;
create policy invoice_drafts_read on public.invoice_drafts for select to authenticated
using (organization_id = public.current_organization_id() and unit_id = public.current_unit_id()
and exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin','manager')));
create policy invoice_drafts_insert on public.invoice_drafts for insert to authenticated
with check (organization_id = public.current_organization_id() and unit_id = public.current_unit_id()
and created_by = auth.uid() and status = 'awaiting_fiscal_validation' and provider_invoice_id is null
and exists(select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin','manager'))
and exists(select 1 from public.billing_drafts b where b.id=billing_draft_id and b.organization_id=invoice_drafts.organization_id and b.unit_id=invoice_drafts.unit_id and b.status='issued' and b.amount_cents=invoice_drafts.amount_cents));
commit;
