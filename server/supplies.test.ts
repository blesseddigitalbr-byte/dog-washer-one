// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext, CurrentUser } from "./_core/context";
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("./_core/supabase.js", () => ({
  withTenantSupabase: (_token: string, op: () => unknown) => op(),
  supabase: mocks,
}));
import {
  suppliesRouter,
  createSupplySchema,
  supplyMovementSchema,
} from "./supplies";
const id = "d0000000-0000-4000-8000-000000000003";
const movement = {
  id,
  requestId: id,
  version: 0,
  kind: "purchase" as const,
  quantity: 1.25,
  purchaseCostCents: 1000,
  reason: "Entrada conferida",
};
function caller(role: CurrentUser["role"] | null = "owner") {
  return suppliesRouter.createCaller({
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
  ])
    q[m] = vi.fn(() => q);
  q.then = (r: any) => Promise.resolve(result).then(r);
  return q;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.rpc.mockResolvedValue({
    data: { stock: 1.25, version: 1, replayed: false },
    error: null,
  });
  mocks.from.mockReturnValue(chain({ data: [], count: 0, error: null }));
});
describe("salon consumable inventory", () => {
  it.each([null, "staff", "student"] as const)(
    "denies %s before database access",
    async role => {
      await expect(caller(role).list({ offset: 0 })).rejects.toMatchObject({
        code: role ? "FORBIDDEN" : "UNAUTHORIZED",
      });
      await expect(caller(role).move(movement)).rejects.toBeTruthy();
      expect(mocks.from).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    }
  );
  it.each(["owner", "admin", "manager"] as const)(
    "allows management %s",
    async role => {
      expect(await caller(role).move(movement)).toMatchObject({ version: 1 });
      expect(mocks.rpc).toHaveBeenCalledWith("move_salon_supply", {
        p_product: id,
        p_request: id,
        p_version: 0,
        p_kind: "purchase",
        p_quantity: 1.25,
        p_cost: 1000,
        p_reason: "Entrada conferida",
        p_document: null,
      });
    }
  );
  it.each([0, -1, NaN, Infinity, 0.0001, 1e10])(
    "rejects invalid movement quantity %s",
    value =>
      expect(
        supplyMovementSchema.safeParse({ ...movement, quantity: value }).success
      ).toBe(false)
  );
  it("requires total purchase cost only for entries", () => {
    expect(
      supplyMovementSchema.safeParse({
        ...movement,
        purchaseCostCents: undefined,
      }).success
    ).toBe(false);
    expect(
      supplyMovementSchema.safeParse({ ...movement, kind: "loss" }).success
    ).toBe(false);
    expect(
      supplyMovementSchema.safeParse({
        ...movement,
        kind: "consumption",
        purchaseCostCents: undefined,
      }).success
    ).toBe(true);
  });
  it("normalizes sku but never creates initial stock", async () => {
    const q = chain({ data: { id, stock: 0 }, error: null });
    mocks.from.mockReturnValue(q);
    const input = createSupplySchema.parse({
      name: " Shampoo ",
      sku: " shampoo-01 ",
      measure: "ml",
    });
    await caller().create(input);
    expect(q.insert).toHaveBeenCalledWith({
      organization_id: id,
      unit_id: id,
      name: "Shampoo",
      sku: "SHAMPOO-01",
      measure: "ml",
      minimum_stock: 0,
    });
  });
  it("scopes list and history by organization/unit", async () => {
    const q = chain({ data: [], count: 0, error: null });
    mocks.from.mockReturnValue(q);
    await caller().history({ id, offset: 0 });
    expect(q.eq).toHaveBeenCalledWith("organization_id", id);
    expect(q.eq).toHaveBeenCalledWith("unit_id", id);
    expect(q.eq).toHaveBeenCalledWith("product_id", id);
  });
  it("reports stale stock without leaking provider errors", async () => {
    mocks.rpc.mockResolvedValue({
      error: { code: "40001", message: "private" },
    });
    await expect(caller().move(movement)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
  it("guards metadata from stale updates", async () => {
    const q = chain({ data: null, error: null });
    mocks.from.mockReturnValue(q);
    await expect(
      caller().update({
        id,
        name: "Shampoo",
        minimumStock: 1,
        isActive: true,
        expectedUpdatedAt: "2026-10-14T00:00:00Z",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(q.eq).toHaveBeenCalledWith("updated_at", "2026-10-14T00:00:00Z");
  });
});
