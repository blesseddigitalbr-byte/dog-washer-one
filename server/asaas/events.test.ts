import { describe, it, expect } from "vitest";
import { paymentEventSchema, paymentState, safeInvoiceUrl, validWebhookToken } from "./events";

describe("Asaas event security and normalization", () => {
  const token = "a-secure-random-token-with-32-characters-minimum";
  it("requires an account-specific secret and rejects missing or incorrect tokens", () => {
    expect(validWebhookToken(token, token)).toBe(true);
    expect(validWebhookToken(undefined, token)).toBe(false);
    expect(validWebhookToken(token, undefined)).toBe(false);
    expect(validWebhookToken("short", "short")).toBe(false);
    expect(validWebhookToken("b".repeat(token.length), token)).toBe(false);
  });
  it("does not confuse confirmation with available cash", () => {
    expect(paymentState("PAYMENT_CONFIRMED")).toBe("confirmed");
    expect(paymentState("PAYMENT_RECEIVED")).toBe("received");
    expect(paymentState("PAYMENT_PARTIALLY_REFUNDED")).toBeNull();
  });
  it("rejects malformed events and negative amounts", () => {
    const payload = { id: "evt_123", event: "PAYMENT_RECEIVED", payment: { id: "pay_123", status: "RECEIVED", value: 150 } };
    expect(paymentEventSchema.safeParse(payload).success).toBe(true);
    expect(paymentEventSchema.safeParse({ ...payload, payment: { ...payload.payment, value: -1 } }).success).toBe(false);
    expect(paymentEventSchema.safeParse({ ...payload, id: "" }).success).toBe(false);
  });
  it("only permits secure Asaas invoice links", () => {
    expect(safeInvoiceUrl("https://www.asaas.com/i/123")).toBe("https://www.asaas.com/i/123");
    expect(safeInvoiceUrl("https://asaas.com.evil.example/i/123")).toBeNull();
    expect(safeInvoiceUrl("http://www.asaas.com/i/123")).toBeNull();
    expect(safeInvoiceUrl(null)).toBeNull();
  });
});
