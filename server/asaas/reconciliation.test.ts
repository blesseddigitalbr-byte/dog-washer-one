import { describe, expect, it } from "vitest";
import { reconciliationState } from "../../shared/reconciliation";
describe("Receipt and service reconciliation", () => {
  const done = { origin: "appointment" as const, paymentStatus: "received", appointmentStatus: "completed", hasProfessional: true, amountMatches: true };
  it("requires received payment and completed service", () => {
    expect(reconciliationState(done)).toBe("ready_for_calculation");
    expect(reconciliationState({ ...done, paymentStatus: "confirmed" })).toBe("receipt_pending");
    expect(reconciliationState({ ...done, appointmentStatus: "confirmed" })).toBe("execution_pending");
  });
  it("does not grant entitlement for refunds, no-shows or mismatched amounts", () => {
    expect(reconciliationState({ ...done, paymentStatus: "refunded" })).toBe("cancelled_payment");
    expect(reconciliationState({ ...done, appointmentStatus: "no_show" })).toBe("service_not_performed");
    expect(reconciliationState({ ...done, amountMatches: false })).toBe("amount_mismatch");
    expect(reconciliationState({ ...done, hasProfessional: false })).toBe("professional_pending");
  });
  it("never distributes a full package payment as a single service", () => {
    expect(reconciliationState({ ...done, origin: "package" })).toBe("package_allocation_pending");
    expect(reconciliationState({ ...done, origin: "standalone" })).toBe("service_link_pending");
  });
});
