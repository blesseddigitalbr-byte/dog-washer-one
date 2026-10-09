import { describe, expect, it } from "vitest";
import { externalInvoiceSchema } from "../../shared/external-invoice";
const note = { number: "1", accessKey: "1".repeat(50), issuedDate: "2026-10-02", amountCents: 25000, serviceDescription: "3 tosas bebê" };
describe("external invoice registration", () => {
  it("allows a historic note pending billing identification", () => expect(externalInvoiceSchema.parse(note).billingDraftId).toBeUndefined());
  it("requires a valid access key, date, positive integer cents and explicit UUID link", () => {
    for (const patch of [{ accessKey: "123" }, { issuedDate: "2026-02-30" }, { amountCents: 0 }, { amountCents: 1.1 }, { billingDraftId: "name" }]) expect(externalInvoiceSchema.safeParse({ ...note, ...patch }).success).toBe(false);
  });
});
