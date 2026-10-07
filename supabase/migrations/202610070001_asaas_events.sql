-- Transactional webhook processing. Credentials remain in server environment variables.
create table public.asaas_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  account_id uuid not null references public.payment_provider_accounts(id),
  external_id text not null,
  status text not null,
  value numeric(14,2) not null check (value >= 0),
  net_value numeric(14,2),
  billing_type text,
  due_date date,
  invoice_url text,
  updated_at timestamptz not null default now(),
  unique(account_id, external_id)
);
create table public.asaas_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  account_id uuid not null references public.payment_provider_accounts(id),
  event_id text not null,
  event_type text not null,
  payment_id text not null,
  processing_status text not null check (processing_status in ('processed','needs_review')),
  created_at timestamptz not null default now(),
  unique(account_id, event_id)
);
alter table public.asaas_payments enable row level security;
alter table public.asaas_webhook_events enable row level security;
create policy financial_read on public.asaas_payments for select to authenticated
using (organization_id = public.current_organization_id() and exists (
  select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin','manager')
));
create policy financial_read on public.asaas_webhook_events for select to authenticated
using (organization_id = public.current_organization_id() and exists (
  select 1 from public.profiles where id = auth.uid() and active and role in ('owner','admin','manager')
));

create or replace function public.process_asaas_payment_event(
  p_account_id uuid, p_event_id text, p_event_type text, p_payment_id text,
  p_status text, p_value numeric, p_net_value numeric, p_billing_type text,
  p_due_date date, p_invoice_url text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  org uuid;
  inserted uuid;
  previous_status text;
begin
  select organization_id into org from public.payment_provider_accounts
    where id = p_account_id and provider = 'asaas' and status = 'active' for update;
  if org is null then raise exception 'Inactive account'; end if;
  if p_status is not null and p_status not in ('pending','confirmed','received','overdue','deleted','refunded') then
    raise exception 'Invalid payment state';
  end if;
  insert into public.asaas_webhook_events(organization_id, account_id, event_id, event_type, payment_id, processing_status)
  values(org, p_account_id, p_event_id, p_event_type, p_payment_id,
    case when p_status is null then 'needs_review' else 'processed' end)
  on conflict(account_id, event_id) do nothing returning id into inserted;
  if inserted is null then return jsonb_build_object('duplicate', true); end if;
  if p_status is null then return jsonb_build_object('needsReview', true); end if;

  select status into previous_status from public.asaas_payments
    where account_id = p_account_id and external_id = p_payment_id for update;
  -- A delayed CREATED/OVERDUE/CONFIRMED event must not undo settlement or refund.
  if (previous_status in ('refunded','deleted') and p_status <> 'refunded')
     or (previous_status = 'received' and p_status in ('pending','overdue','confirmed'))
     or (previous_status = 'confirmed' and p_status in ('pending','overdue')) then
    return jsonb_build_object('processed', true, 'stale', true);
  end if;
  insert into public.asaas_payments(organization_id, account_id, external_id, status, value,
    net_value, billing_type, due_date, invoice_url)
  values(org, p_account_id, p_payment_id, p_status, p_value, p_net_value, p_billing_type, p_due_date, p_invoice_url)
  on conflict(account_id, external_id) do update set
    status = excluded.status, value = excluded.value,
    net_value = coalesce(excluded.net_value, public.asaas_payments.net_value),
    billing_type = coalesce(excluded.billing_type, public.asaas_payments.billing_type),
    due_date = coalesce(excluded.due_date, public.asaas_payments.due_date),
    invoice_url = coalesce(excluded.invoice_url, public.asaas_payments.invoice_url), updated_at = now();
  return jsonb_build_object('processed', true);
end $$;
revoke all on function public.process_asaas_payment_event(uuid,text,text,text,text,numeric,numeric,text,date,text) from public, anon, authenticated;
grant execute on function public.process_asaas_payment_event(uuid,text,text,text,text,numeric,numeric,text,date,text) to service_role;
