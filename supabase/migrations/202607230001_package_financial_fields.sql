alter table public.client_packages
  add column if not exists frequency text not null default 'weekly'
    check (frequency in ('weekly','biweekly','every_21_days','monthly','custom')),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','refunded','waived')),
  add column if not exists payment_date date,
  add column if not exists payment_method text;

-- Registros anteriores eram tratados como faturamento. Preservamos ativos como pagos
-- e retiramos cancelados do realizado, permitindo correção manual posterior.
update public.client_packages
set payment_status = case when status = 'cancelled' then 'refunded' else 'paid' end,
    payment_date = case when status = 'cancelled' then null else coalesce(payment_date, contract_date) end
where payment_status = 'pending';

create index if not exists idx_client_packages_financial_status
  on public.client_packages(unit_id, payment_status, status);
