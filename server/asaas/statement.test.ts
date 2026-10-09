import { expect, it } from "vitest";
import { normalizeStatement, statementQuerySchema } from "./statement";
it("preserves receipt and fee as separate entries with signed cents", () => {
  const result = normalizeStatement({ balance: 53.42 }, { hasMore: true, data: [{ id: "ft1", date: "2026-10-08", type: "PAYMENT_RECEIVED", value: 5, paymentId: "pay_test" }, { id: "ft2", date: "2026-10-08", type: "PAYMENT_FEE", value: -0.99 }, { id: "ft3", date: "2026-10-08", type: "NEW_PROVIDER_TYPE", value: 0 }] });
  expect(result.balanceCents).toBe(5342);
  expect(result.pageCreditsCents).toBe(500);
  expect(result.pageDebitsCents).toBe(99);
  expect(result.hasMore).toBe(true);
  expect(result.entries).toHaveLength(3);
});
it("rejects duplicates and invalid date ranges", () => {
  const entry = { id: "ft1", date: "2026-10-08", type: "PAYMENT_RECEIVED", value: 5 };
  expect(() => normalizeStatement({ balance: 1 }, { hasMore: false, data: [entry, entry] })).toThrow();
  expect(statementQuerySchema.safeParse({ startDate: "2026-10-09", finishDate: "2026-10-08" }).success).toBe(false);
  expect(statementQuerySchema.safeParse({ startDate: "2026-02-30", finishDate: "2026-03-01" }).success).toBe(false);
  expect(statementQuerySchema.safeParse({ startDate: "2026-01-01", finishDate: "2026-10-08" }).success).toBe(false);
});
