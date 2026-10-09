import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { reconciliationState } from "../../shared/reconciliation";
import { monthlySettlement } from "./settlement";
describe("execution reversal", () => {
  it("blocks calculation even if payment and original completion persist", () => {
    expect(reconciliationState({ origin: "appointment", executionReversed: true, appointmentStatus: "completed", paymentStatus: "received", hasProfessional: true })).toBe("execution_reversed");
    const result = monthlySettlement([{ appointmentId: "a", professionalId: "p", paymentId: "pay", status: "completed", paymentStatus: "received", serviceValueCents: 10000, executionReversed: true }], 4000, 0);
    expect(result.payableCents).toBe(0);
  });
  it("restores recorded consumption once without extending expiry or deleting history", () => {
    const sql = readFileSync("supabase/migrations/202610080009_execution_reversal.sql", "utf8");
    expect(sql).toContain("appointment_id uuid primary key"); expect(sql).toContain("for update");
    expect(sql).toContain("result.appointment_id is not null then return result");
    expect(sql).toContain("consumption.session_type"); expect(sql).toContain("balance_baths+bath<=contracted_baths");
    expect(sql).not.toContain("expiry_date="); expect(sql).not.toContain("delete from");
    expect(sql).toContain("financial_review_required boolean not null default true");
  });
});
