-- Verified provider snapshots, not inferred from payment receipt.
create table public.asaas_split_reconciliation (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  account_id uuid not null references public.payment_provider_accounts(id),
  payment_id text not null,
  split_id text not null,
  partner_name text not null,
  wallet_id text not null,
  status text not null check(status in ('PENDING','AWAITING_CREDIT','DONE','CANCELLED','REFUSED','REFUNDED')),
  gross_value numeric(14,2) not null check(gross_value >= 0),
  net_value numeric(14,2) not null check(net_value >= 0),
  partner_value numeric(14,2) not null check(partner_value >= 0),
  verified_at timestamptz not null,
  evidence_source text not null,
  unique(account_id, split_id)
);
alter table public.asaas_split_reconciliation enable row level security;
create policy financial_read on public.asaas_split_reconciliation for select to authenticated
using (organization_id = public.current_organization_id() and exists (
  select 1 from public.profiles where id=auth.uid() and active and role in ('owner','admin','manager')
));
