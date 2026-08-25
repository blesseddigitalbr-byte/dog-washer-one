import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normalizePhone, verifyWebhookSignature } from "./_core/whatsapp";

describe("WhatsApp Cloud API safeguards", () => {
  it("normalizes a Brazilian phone number for the Meta API", () => {
    expect(normalizePhone("+55 (61) 99988-5480")).toBe("5561999885480");
  });

  it("accepts only the signature generated with the Meta app secret", () => {
    const body = Buffer.from(JSON.stringify({ object: "whatsapp_business_account" }));
    const secret = "test-app-secret";
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
    const tampered = `${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`;
    expect(verifyWebhookSignature(body, tampered, secret)).toBe(false);
    expect(verifyWebhookSignature(body, "", secret)).toBe(false);
  });
});
