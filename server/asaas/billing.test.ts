import { describe, expect, it } from "vitest";
import { billingDraftSchema, parseBrlCents } from "../../shared/billing";
const draft = { id: "11111111-1111-4111-8111-111111111111", clientId: "22222222-2222-4222-8222-222222222222", origin: "standalone", amountCents: 12345, billingType: "PIX", dueDate: "2026-10-07", description: "Serviço" };
describe("Shared billing validation", () => {
  it("parses Brazilian amounts without fractional cents", () => {
    expect(parseBrlCents("123,45")).toBe(12345);
    expect(parseBrlCents("10,5")).toBe(1050);
    for (const value of ["", "0", "-1", "10.50", "1,234", "NaN"]) expect(parseBrlCents(value)).toBeNull();
  });
  it("requires a valid date and integer positive amount", () => {
    expect(billingDraftSchema.safeParse(draft).success).toBe(true);
    for (const change of [{ dueDate: "2026-02-30" }, { amountCents: 1.1 }, { amountCents: 0 }])
      expect(billingDraftSchema.safeParse({ ...draft, ...change }).success).toBe(false);
  });
  it("requires origin linkage only for appointments or packages", () => {
    expect(billingDraftSchema.safeParse({ ...draft, origin: "appointment" }).success).toBe(false);
    expect(billingDraftSchema.safeParse({ ...draft, origin: "package", originId: draft.id }).success).toBe(true);
    expect(billingDraftSchema.safeParse({ ...draft, originId: draft.id }).success).toBe(false);
  });
});
