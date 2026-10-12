import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const sql=readFileSync("supabase/migrations/20261012194057_atomic_simulation_confirmation_homologated.sql","utf8");
describe("atomic simulation migration contract, not runtime homologation",()=>{
  it("authorizes and scopes the transaction and repeat response",()=>{
    expect(sql).toContain("id=auth.uid() and active");
    expect(sql).toContain("organization_id=public.current_organization_id() and unit_id=public.current_unit_id() for update");
    expect(sql).toContain("'alreadyConfirmed',true");
    expect(sql).toContain("pg_advisory_xact_lock");
  });
  it("writes attendance, service and item link in one function without consuming balance",()=>{
    expect(sql).toContain("insert into public.appointments");
    expect(sql).toContain("insert into public.appointment_services");
    expect(sql).toContain("set status='created',appointment_id=apt_id");
    expect(sql).not.toContain("update public.client_packages");
    expect(sql).toContain("parent.status<>'draft'");
  });
  it("checks existing reservations and active unit-owned resources",()=>{
    expect(sql).toContain("selected_count+reserved_baths>pkg.balance_baths");
    expect(sql).toContain("grooming_count+reserved_groomings>pkg.balance_groomings");
    expect(sql).toContain("and organization_id=sim.organization_id and status='active' and is_active");
    expect(sql).toContain("from public,anon");
    expect(sql).toContain("security invoker set search_path=''");
  });
});
