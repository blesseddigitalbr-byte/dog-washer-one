import { afterEach, describe, expect, it, vi } from "vitest";
import { sandboxAsaas, verifiedDraftPayment } from "./client";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("Sandbox charge adapter", () => {
  it("rejects missing or unsafe credentials before network calls", () => {
    expect(() => sandboxAsaas("arbitrary")).toThrow();
    expect(() => sandboxAsaas("ASAAS_MISSING_TEST")).toThrow();
  });
  it("uses only sandbox, does not retry POSTs and hides provider response details", async () => {
    vi.stubEnv("ASAAS_TEST_API_KEY", "test-secret");
    const request = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    vi.stubGlobal("fetch", request);
    await expect(sandboxAsaas("ASAAS_TEST")("payments", { value: 1 })).rejects.toThrow("400");
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe("https://api-sandbox.asaas.com/v3/payments");
  });
  it("requires amount, reference, customer and method to match before linking", () => {
    const draft = { id: "draft", provider_customer_id: "cus_1", amount_cents: 10000, billing_type: "PIX" };
    const payment = { id: "pay_1", externalReference: "draft", customer: "cus_1", value: 100, billingType: "PIX" };
    expect(verifiedDraftPayment(payment, draft)).toBe(true);
    for (const change of [{ value: 99 }, { customer: "cus_2" }, { externalReference: "other" }, { billingType: "BOLETO" }]) expect(verifiedDraftPayment({ ...payment, ...change }, draft)).toBe(false);
  });
});
