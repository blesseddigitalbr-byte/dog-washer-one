// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext, CurrentUser } from "./_core/context";
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({
  withTenantSupabase: (_token: string, op: () => unknown) => op(),
  supabase: mocks,
}));
import {
  purchasesRouter,
  purchaseDocumentSchema,
  manualPaymentSchema,
} from "./purchases";
const id = "d0000000-0000-4000-8000-000000000003";
function caller(role: CurrentUser["role"] | null = "owner") {
  return purchasesRouter.createCaller({
    user: role
      ? {
          id,
          email: "test@example.invalid",
          name: null,
          displayName: null,
          phone: null,
          role,
          organizationId: id,
          unitId: id,
        }
      : null,
    accessToken: role ? "test" : null,
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  });
}
function chain(result: any) {
  const q: any = {};
  for (const m of [
    "select",
    "eq",
    "order",
    "range",
    "insert",
    "single",
    "update",
    "maybeSingle",
    "in",
  ])
    q[m] = vi.fn(() => q);
  q.then = (r: any) => Promise.resolve(result).then(r);
  return q;
}
const payment = {
  documentId: id,
  requestId: id,
  amountCents: 100,
  date: "2026-10-14",
  method: "PIX" as const,
  reference: "Conferido no extrato",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({ data: id, error: null });
  mocks.from.mockReturnValue(chain({ data: [], count: 0, error: null }));
});
describe("supplier purchase documents", () => {
  it.each([null, "staff", "student"] as const)("blocks %s", async role => {
    await expect(caller(role).suppliers({ offset: 0 })).rejects.toMatchObject({
      code: role ? "FORBIDDEN" : "UNAUTHORIZED",
    });
    await expect(caller(role).recordPayment(payment)).rejects.toBeTruthy();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["owner", "admin", "manager"] as const)(
    "registers manual payment for %s without bank calls",
    async role => {
      expect(await caller(role).recordPayment(payment)).toEqual({ id });
      expect(mocks.rpc).toHaveBeenCalledWith("record_supplier_payment", {
        p_document: id,
        p_request: id,
        p_amount: 100,
        p_date: "2026-10-14",
        p_method: "PIX",
        p_reference: "Conferido no extrato",
      });
    }
  );
  it.each([0, -1, Infinity, 1.5, 1e13])(
    "rejects invalid payment cents %s",
    amountCents => {
      expect(
        manualPaymentSchema.safeParse({ ...payment, amountCents }).success
      ).toBe(false);
    }
  );
  it("does not accept paid totals from invoice input", () => {
    const data = purchaseDocumentSchema.parse({
      supplierId: id,
      number: "123",
      issueDate: "2026-10-14",
      totalCents: 100,
      paidCents: 100,
    });
    expect(data).not.toHaveProperty("paidCents");
  });
  it("scopes notes and exact number filter", async () => {
    const q = chain({ data: [], count: 0, error: null });
    mocks.from.mockReturnValue(q);
    await caller().documents({ offset: 0, number: "123" });
    expect(q.eq).toHaveBeenCalledWith("organization_id", id);
    expect(q.eq).toHaveBeenCalledWith("unit_id", id);
    expect(q.eq).toHaveBeenCalledWith("number", "123");
  });
  it("creates a note without issuing or paying it", async () => {
    const q = chain({ data: { id }, error: null });
    mocks.from.mockReturnValue(q);
    await caller().createDocument({
      supplierId: id,
      number: "123",
      series: "1",
      issueDate: "2026-10-14",
      totalCents: 100,
    });
    expect(q.insert).toHaveBeenCalledWith({
      organization_id: id,
      unit_id: id,
      supplier_id: id,
      number: "123",
      series: "1",
      issue_date: "2026-10-14",
      total_cents: 100,
      access_key: null,
      notes: null,
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("reports conflicting payment request safely", async () => {
    mocks.rpc.mockResolvedValue({
      error: { code: "40001", message: "private" },
    });
    await expect(caller().recordPayment(payment)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});
