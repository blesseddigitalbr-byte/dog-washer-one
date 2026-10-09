import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync("supabase/migrations/202610080010_execution_history_security.sql", "utf8");
describe("execution migration contract (not database homologation)", () => {
  it("protects history and explicitly authorizes the privileged procedure", () => {
    expect(sql).toContain("revoke insert, update, delete on public.package_sessions, public.visit_history");
    expect(sql).toContain("id=auth.uid() and active");
    expect(sql).toContain("role in ('owner','admin','manager','staff')");
    expect(sql).toContain("organization_id=public.current_organization_id() and unit_id=public.current_unit_id() for update");
    expect(sql).toContain("security definer set search_path=''");
  });
  it("rejects expired, future, reversed and inconsistent execution", () => {
    expect(sql).toContain("expiry_date >= (now() at time zone 'America/Sao_Paulo')::date");
    expect(sql).toContain("contract_date <= (now() at time zone 'America/Sao_Paulo')::date");
    expect(sql.indexOf("apt.execution_reversed_at is not null")).toBeLessThan(sql.indexOf("apt.status='completed'"));
    expect(sql).toContain("Histórico incompatível com a baixa");
  });
});
