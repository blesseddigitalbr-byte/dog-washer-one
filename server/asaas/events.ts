import { timingSafeEqual } from "node:crypto";
import { z } from "zod";

const amount = z.number().finite().nonnegative().max(100_000_000);
export const paymentEventSchema = z.object({
  id: z.string().min(1).max(160),
  event: z.string().startsWith("PAYMENT_").max(100),
  dateCreated: z.string().max(40).optional(),
  payment: z.object({
    id: z.string().min(1).max(160),
    value: amount,
    netValue: amount.optional(),
    status: z.string().max(80),
    billingType: z.string().max(40).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    invoiceUrl: z.string().url().max(1000).optional().nullable(),
  }),
});

export function validWebhookToken(received: string | undefined, expected: string | undefined) {
  if (!expected || expected.length < 32 || !received) return false;
  const a = Buffer.from(received), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Confirmation is not settlement. Do not count confirmed cards as available cash.
export function paymentState(event: string): string | null {
  return ({
    PAYMENT_CREATED: "pending", PAYMENT_UPDATED: "pending",
    PAYMENT_CONFIRMED: "confirmed", PAYMENT_RECEIVED: "received",
    PAYMENT_OVERDUE: "overdue", PAYMENT_DELETED: "deleted",
    PAYMENT_REFUNDED: "refunded",
  } as Record<string, string>)[event] ?? null;
}

export function safeInvoiceUrl(value: string | null | undefined) {
  if (!value) return null;
  const url = new URL(value);
  return url.protocol === "https:" && (url.hostname === "asaas.com" || url.hostname.endsWith(".asaas.com")) ? value : null;
}
