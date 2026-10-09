import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const sql = readFileSync("supabase/migrations/202610080008_appointment_cancellation.sql", "utf8");
describe("cancellation database contract", () => {
  it("serializes with completion and records actor/reason once", () => {
    expect(sql).toContain("for update"); expect(sql).toContain("appointment_id uuid primary key");
    expect(sql).toContain("auth.uid()"); expect(sql).toContain("trim(p_reason)");
    expect(sql).toContain("if apt.status='cancelled' then return apt");
  });
  it("does not refund payments or restore credits without recorded consumption", () => {
    expect(sql).toContain("select 1 from public.package_sessions");
    expect(sql).not.toContain("update public.client_packages");
    expect(sql).not.toContain("update public.billing_drafts");
    expect(sql).toContain("Baixa concluída exige correção auditada");
  });
});
