-- Emergency rollback only. NOT executed. Removes only the additive objects of
-- 20261012194057; does not delete appointments, simulations, items, or balances.
-- After rollback the new API fails closed; do not restore multistep writes.
begin;
drop trigger if exists guard_simulation_item_edit on public.schedule_simulation_items;
drop function if exists public.guard_simulation_item_edit();
drop function if exists public.confirm_schedule_simulation(uuid,boolean);
commit;
