import { describe, expect, it } from "vitest";
import { monthlySettlement, type ServiceAllocation } from "./settlement";

const service: ServiceAllocation = {
  appointmentId: "visit-1", professionalId: "partner-1", paymentId: "payment-1",
  status: "completed", paymentStatus: "received", serviceValueCents: 10000,
};
describe("Recovered monthly financial eligibility", () => {
  it("deducts monthly fees once, not once per appointment", () => {
    expect(monthlySettlement([service, { ...service, appointmentId: "visit-2" }], 4000, 1000))
      .toMatchObject({ earnedCents: 8000, deductedCents: 1000, payableCents: 7000 });
  });
  it("does not earn on scheduling, cancellation, absence or confirmation", () => {
    for (const status of ["scheduled", "confirmed", "in_progress", "cancelled", "no_show"] as const)
      expect(monthlySettlement([{ ...service, status }], 4000, 0).payableCents).toBe(0);
  });
  it("requires settlement, not merely card confirmation", () => {
    for (const paymentStatus of ["pending", "confirmed", "refunded"] as const)
      expect(monthlySettlement([{ ...service, paymentStatus }], 4000, 0).payableCents).toBe(0);
  });
  it("rejects duplicate service rights and mixed partners", () => {
    expect(() => monthlySettlement([service, service], 4000, 0)).toThrow(/duplicado/);
    expect(() => monthlySettlement([service, { ...service, appointmentId: "visit-2", professionalId: "other" }], 4000, 0)).toThrow(/único/);
  });
  it("keeps a fee shortfall explicit without negative transfers", () => {
    expect(monthlySettlement([service], 4000, 5000)).toMatchObject({ payableCents: 0, uncoveredFeesCents: 1000 });
  });
  it("rejects fractional cents and out-of-range percentages", () => {
    expect(() => monthlySettlement([{ ...service, serviceValueCents: 1.5 }], 4000, 0)).toThrow();
    expect(() => monthlySettlement([service], 10001, 0)).toThrow();
  });
});
