alter table public.billing_drafts
  add column account_id uuid references public.payment_provider_accounts(id),
  add column provider_customer_id text,
  add column provider_invoice_url text;
-- State transitions are server-only after a tenant-authorized read. No browser UPDATE policy.
create unique index billing_drafts_provider_payment_unique
  on public.billing_drafts(account_id, provider_payment_id) where provider_payment_id is not null;
