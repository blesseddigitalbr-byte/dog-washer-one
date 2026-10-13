-- Financial configuration is managed by trusted server procedures, not direct client writes.
drop policy tenant_isolation on public.payment_provider_accounts;
drop policy tenant_isolation on public.financial_ledgers;
revoke all on public.payment_provider_accounts,public.financial_ledgers from anon,authenticated;
grant select on public.payment_provider_accounts,public.financial_ledgers to authenticated;
grant all on public.payment_provider_accounts,public.financial_ledgers to service_role;
create policy financial_account_read on public.payment_provider_accounts for select to authenticated using (
 organization_id=public.current_organization_id()
 and public.current_profile_role() in ('owner','admin','manager')
 and exists(select 1 from public.units u where u.id=public.current_unit_id() and u.organization_id=payment_provider_accounts.organization_id and u.legal_entity_id=payment_provider_accounts.legal_entity_id)
);
create policy financial_ledger_read on public.financial_ledgers for select to authenticated using (
 organization_id=public.current_organization_id()
 and unit_id=public.current_unit_id()
 and public.current_profile_role() in ('owner','admin','manager')
);

