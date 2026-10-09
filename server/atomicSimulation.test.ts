import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const sql=readFileSync("supabase/migrations/202610090001_atomic_simulation_confirmation.sql","utf8");
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
});
